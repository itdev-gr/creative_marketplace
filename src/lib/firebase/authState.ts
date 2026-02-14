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
const listeners = new Set<(user: AuthStateUser | null) => void>();

function notifyListeners() {
  listeners.forEach((fn) => fn(cachedUser));
}

export function subscribeAuth(callback: (user: AuthStateUser | null) => void): () => void {
  listeners.add(callback);
  if (cachedUser !== undefined) callback(cachedUser);
  return () => listeners.delete(callback);
}

export function getCurrentUser(): AuthStateUser | null {
  return cachedUser;
}

if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      cachedUser = null;
      notifyListeners();
      return;
    }
    const profile = await getCurrentUserProfile(firebaseUser.uid);
    cachedUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email ?? null,
      profile,
    };
    notifyListeners();
  });
}
