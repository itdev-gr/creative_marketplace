import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config.js';
import { getCurrentUserProfile } from '../services/authService.js';
import type { UserProfile } from '../types/user.js';

export interface AuthStateUser {
  id: string;
  email: string | null;
  profile: UserProfile | null;
}

let cachedUser: AuthStateUser | null = null;
let authReady = false;
const listeners = new Set<(user: AuthStateUser | null) => void>();

function notifyListeners() {
  listeners.forEach((fn) => fn(cachedUser));
}

export function subscribeAuth(callback: (user: AuthStateUser | null) => void): () => void {
  listeners.add(callback);
  if (authReady) callback(cachedUser);
  return () => listeners.delete(callback);
}

export function getCurrentUser(): AuthStateUser | null {
  return cachedUser;
}

/** True after the first onAuthStateChanged has run (auth state is known). */
export function isAuthReady(): boolean {
  return authReady;
}

const AUTH_SESSION_LOG = '[AuthSession]';

if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, async (firebaseUser) => {
    console.log(AUTH_SESSION_LOG, 'onAuthStateChanged', firebaseUser ? { uid: firebaseUser.uid } : 'user=null');
    if (!firebaseUser) {
      cachedUser = null;
      authReady = true;
      notifyListeners();
      console.log(AUTH_SESSION_LOG, 'auth state updated: user=null');
      return;
    }
    let profile: UserProfile | null = null;
    try {
      profile = await getCurrentUserProfile(firebaseUser.uid);
      if (!profile) {
        const { ensureUserDocForAuthUser } = await import('../services/authService.js');
        await ensureUserDocForAuthUser(
          firebaseUser.uid,
          firebaseUser.email ?? '',
          firebaseUser.displayName ?? undefined
        );
        profile = await getCurrentUserProfile(firebaseUser.uid);
      }
    } catch (err) {
      console.warn(AUTH_SESSION_LOG, 'getCurrentUserProfile failed', err);
      // Still treat as logged-in; profile may load later or fail due to permissions
    }
    cachedUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email ?? null,
      profile,
    };
    authReady = true;
    notifyListeners();
    console.log(AUTH_SESSION_LOG, 'auth state updated:', { uid: firebaseUser.uid });
  });
}
