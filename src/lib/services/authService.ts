import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, getDocs, query, where, limit, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config.js';
import type { AccountType } from '../types/role.js';
import type { UserProfile } from '../types/user.js';
import { isRole, isLegacyRole, isSellerMode } from '../types/role.js';
import {
  EmailAlreadyInUseError,
  InvalidCredentialError,
  WeakPasswordError,
  AuthNetworkError,
  AuthError,
} from '../errors/auth.js';
import { generateUniqueUserCode, generateUniqueSellerCode } from '../utils/codeGen.js';

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

const AUTH_LOG = '[Auth]';

function dataToProfile(id: string, data: Record<string, unknown>): UserProfile {
  const accountType = data?.accountType as AccountType | undefined;
  const hasNewSchema = accountType === 'user' || accountType === 'seller';
  if (hasNewSchema && data?.userCode) {
    const profile: UserProfile = {
      id,
      userCode: data.userCode as string,
      email: (data?.email as string) ?? '',
      displayName: data?.displayName as string | undefined,
      createdAt: data?.createdAt,
      accountType: accountType as AccountType,
    };
    if (accountType === 'seller') {
      profile.sellerCode = data?.sellerCode as string | undefined;
      profile.sellerRole = data?.sellerRole as UserProfile['sellerRole'];
      profile.mode = (data?.mode as UserProfile['mode']) ?? 'selling';
      profile.sellerProfile = data?.sellerProfile as UserProfile['sellerProfile'];
    } else {
      profile.canBuy = (data?.canBuy as boolean) ?? false;
    }
    return profile;
  }
  const legacyRole = data?.role;
  if (!legacyRole || !isLegacyRole(legacyRole)) return null as unknown as UserProfile;
  const account: AccountType = legacyRole === 'user' ? 'user' : 'seller';
  const profile: UserProfile = {
    id,
    userCode: (data?.userCode as string) ?? '',
    email: (data?.email as string) ?? '',
    displayName: data?.displayName as string | undefined,
    createdAt: data?.createdAt,
    accountType: account,
  };
  if (account === 'seller') {
    profile.sellerRole = isRole(legacyRole) ? legacyRole : undefined;
    profile.sellerCode = data?.sellerCode as string | undefined;
    profile.mode = (data?.mode as UserProfile['mode']) ?? 'selling';
  } else {
    profile.canBuy = (data?.canBuy as boolean) ?? false;
  }
  return profile;
}

export async function signUp(
  email: string,
  password: string,
  accountType: AccountType,
  displayName?: string
): Promise<User> {
  console.log(AUTH_LOG, 'SignUp attempt', { email, accountType });
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { uid } = userCredential.user;
    console.log(AUTH_LOG, 'Firebase user created', { uid });

    const userCode = await generateUniqueUserCode();
    const base: Record<string, unknown> = {
      userCode,
      accountType,
      email,
      displayName: displayName ?? null,
      createdAt: serverTimestamp(),
    };

    if (accountType === 'user') {
      await setDoc(doc(db, USERS_COLLECTION, uid), { ...base, canBuy: false });
    } else {
      const sellerCode = await generateUniqueSellerCode();
      await setDoc(doc(db, USERS_COLLECTION, uid), {
        ...base,
        sellerCode,
        mode: 'selling',
        sellerRole: null,
      });
    }
    console.log(AUTH_LOG, 'SignUp success', { uid, accountType });
    return userCredential.user;
  } catch (err) {
    console.error(AUTH_LOG, 'SignUp error (raw)', err);
    const code = err && typeof err === 'object' && 'code' in err ? (err as { code: string }).code : '';
    if (code === 'permission-denied' || code === 'firestore/permission-denied') {
      const firestoreError = new AuthError(
        'Profile could not be created. Check that Firestore rules are deployed and allow creating your user document.',
        'unknown'
      );
      console.warn(AUTH_LOG, 'SignUp failed', { email, code: 'permission-denied' });
      throw firestoreError;
    }
    const mapped = mapFirebaseAuthError(err);
    console.warn(AUTH_LOG, 'SignUp failed', { email, code: mapped.code });
    throw mapped;
  }
}

export async function signIn(email: string, password: string): Promise<User> {
  console.log(AUTH_LOG, 'SignIn attempt', { email });
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    console.log(AUTH_LOG, 'SignIn success', { uid });
    return userCredential.user;
  } catch (err) {
    const mapped = mapFirebaseAuthError(err);
    console.warn(AUTH_LOG, 'SignIn failed', { email, code: mapped.code });
    throw mapped;
  }
}

export function signOut(): Promise<void> {
  console.log(AUTH_LOG, 'SignOut');
  return firebaseSignOut(auth);
}

export async function getCurrentUserProfile(uid: string): Promise<UserProfile | null> {
  return getProfile(uid);
}

/**
 * Creates a user document in Firestore for an existing Auth user who has no profile yet
 * (e.g. legacy account or account created outside the app). Defaults to accountType 'user'.
 */
export async function ensureUserDocForAuthUser(
  uid: string,
  email: string,
  displayName?: string | null
): Promise<void> {
  const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
  if (snap.exists()) return;

  const userCode = await generateUniqueUserCode();
  await setDoc(doc(db, USERS_COLLECTION, uid), {
    userCode,
    accountType: 'user',
    email: email || '',
    displayName: displayName ?? null,
    canBuy: false,
    createdAt: serverTimestamp(),
  });
}

/** Fetch any user's profile by uid. Supports new schema and legacy (role-based) docs. */
export async function getProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (!data?.email) return null;

  const hasNewSchema = (data.accountType === 'user' || data.accountType === 'seller') && data.userCode;
  if (!hasNewSchema && isLegacyRole(data.role as string)) {
    const userCode = await generateUniqueUserCode();
    const legacyRole = data.role as string;
    const accountType: AccountType = legacyRole === 'user' ? 'user' : 'seller';
    const updates: Record<string, unknown> = {
      userCode,
      accountType,
    };
    if (accountType === 'seller') {
      const sellerCode = await generateUniqueSellerCode();
      updates.sellerCode = sellerCode;
      updates.mode = 'selling';
      updates.sellerRole = isRole(legacyRole) ? legacyRole : null;
    } else {
      updates.canBuy = false;
    }
    await updateDoc(doc(db, USERS_COLLECTION, uid), updates);
    const merged = { ...data, ...updates };
    return dataToProfile(snap.id, merged);
  }

  return dataToProfile(snap.id, data);
}

/** Resolve profile by userCode (for /profile/{userCode} URLs). */
export async function getProfileByUserCode(userCode: string): Promise<UserProfile | null> {
  const q = query(
    collection(db, USERS_COLLECTION),
    where('userCode', '==', userCode),
    limit(1)
  );
  const snapshot = await getDocs(q);
  const first = snapshot.docs[0];
  if (!first) return null;
  return getProfile(first.id);
}

/** Resolve profile by sellerCode (for /seller/{sellerCode} URLs). */
export async function getProfileBySellerCode(sellerCode: string): Promise<UserProfile | null> {
  const q = query(
    collection(db, USERS_COLLECTION),
    where('sellerCode', '==', sellerCode),
    limit(1)
  );
  const snapshot = await getDocs(q);
  const first = snapshot.docs[0];
  if (!first) return null;
  return getProfile(first.id);
}

/** Update seller mode (selling | buying). Caller must ensure user is seller. */
export async function updateMode(uid: string, mode: 'selling' | 'buying'): Promise<void> {
  if (!isSellerMode(mode)) return;
  const ref = doc(db, USERS_COLLECTION, uid);
  await updateDoc(ref, { mode });
}

/** Set user's canBuy flag. Caller must ensure user is accountType 'user'. */
export async function updateCanBuy(uid: string, canBuy: boolean): Promise<void> {
  const ref = doc(db, USERS_COLLECTION, uid);
  await updateDoc(ref, { canBuy });
}

/** Update seller profile (sellerRole, optional bio). For seller setup and edit. */
export async function updateSellerProfile(
  uid: string,
  data: { sellerRole: import('../types/role.js').Role; sellerProfile?: { bio?: string } }
): Promise<void> {
  const ref = doc(db, USERS_COLLECTION, uid);
  await updateDoc(ref, data);
}
