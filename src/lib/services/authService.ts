import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config.js';
import type { Role } from '../types/role.js';
import type { UserProfile } from '../types/user.js';
import { isRole } from '../types/role.js';
import {
  EmailAlreadyInUseError,
  InvalidCredentialError,
  WeakPasswordError,
  AuthNetworkError,
  AuthError,
} from '../errors/auth.js';

const USERS_COLLECTION = 'users';

function mapFirebaseAuthError(err: unknown): AuthError {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code: string }).code;
    if (code === 'auth/email-already-in-use') return new EmailAlreadyInUseError();
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found')
      return new InvalidCredentialError();
    if (code === 'auth/weak-password') return new WeakPasswordError();
    if (code === 'auth/network-request-failed') return new AuthNetworkError();
  }
  return new AuthError(
    'Something went wrong. Please try again.',
    'unknown'
  );
}

export async function signUp(
  email: string,
  password: string,
  role: Role,
  displayName?: string
): Promise<User> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { uid } = userCredential.user;
    await setDoc(doc(db, USERS_COLLECTION, uid), {
      role,
      email,
      displayName: displayName ?? null,
      createdAt: serverTimestamp(),
    });
    return userCredential.user;
  } catch (err) {
    throw mapFirebaseAuthError(err);
  }
}

export async function signIn(email: string, password: string): Promise<User> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (err) {
    throw mapFirebaseAuthError(err);
  }
}

export function signOut(): Promise<void> {
  return firebaseSignOut(auth);
}

export async function getCurrentUserProfile(uid: string): Promise<UserProfile | null> {
  return getProfile(uid);
}

/** Fetch any user's profile (for profile page). Requires auth. */
export async function getProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  const role = data?.role;
  if (!role || !isRole(role)) return null;
  return {
    id: snap.id,
    role,
    email: data?.email ?? '',
    displayName: data?.displayName ?? undefined,
    createdAt: data?.createdAt,
  };
}
