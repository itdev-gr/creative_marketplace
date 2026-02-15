import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebase/config.js';
import { getProfile, updateSellerProfile } from './authService.js';
import type { Role } from '../types/role.js';
import { SELLER_ROLES } from '../types/role.js';
import { isRole } from '../types/role.js';

const SERVICE_PROFILES_COLLECTION = 'serviceProfiles';

export interface ServiceProfile {
  sellerId: string;
  role: Role;
  bio: string | null;
  isComplete: boolean;
  displayName: string;
  sellerCode: string;
  createdAt: unknown;
}

function docId(sellerId: string, role: Role): string {
  return `${sellerId}_${role}`;
}

function snapshotToServiceProfile(data: Record<string, unknown>): ServiceProfile {
  return {
    sellerId: data.sellerId as string,
    role: data.role as Role,
    bio: (data.bio as string) ?? null,
    isComplete: (data.isComplete as boolean) ?? false,
    displayName: (data.displayName as string) ?? '',
    sellerCode: (data.sellerCode as string) ?? '',
    createdAt: data.createdAt,
  };
}

export async function getServiceProfile(sellerId: string, role: Role): Promise<ServiceProfile | null> {
  if (!isRole(role) || !SELLER_ROLES.includes(role)) return null;
  const ref = doc(db, SERVICE_PROFILES_COLLECTION, docId(sellerId, role));
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snapshotToServiceProfile(snap.data());
}

export async function getServiceProfilesBySeller(sellerId: string): Promise<ServiceProfile[]> {
  const q = query(
    collection(db, SERVICE_PROFILES_COLLECTION),
    where('sellerId', '==', sellerId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => snapshotToServiceProfile(d.data()));
}

export async function createOrUpdateServiceProfile(
  sellerId: string,
  role: Role,
  data: { bio?: string }
): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid || uid !== sellerId) throw new Error('Unauthorized');
  if (!isRole(role) || !SELLER_ROLES.includes(role)) throw new Error('Invalid role');

  const userProfile = await getProfile(sellerId);
  if (!userProfile || userProfile.accountType !== 'seller') throw new Error('Seller profile not found');
  const displayName = userProfile.displayName ?? userProfile.email ?? 'Creator';
  const sellerCode = userProfile.sellerCode ?? '';

  const ref = doc(db, SERVICE_PROFILES_COLLECTION, docId(sellerId, role));
  const snap = await getDoc(ref);
  const now = serverTimestamp();

  if (snap.exists()) {
    await setDoc(ref, {
      sellerId,
      role,
      bio: data.bio?.trim() ?? null,
      isComplete: true,
      displayName,
      sellerCode,
      updatedAt: now,
      createdAt: snap.data()?.createdAt ?? now,
    }, { merge: true });
  } else {
    await setDoc(ref, {
      sellerId,
      role,
      bio: data.bio?.trim() ?? null,
      isComplete: true,
      displayName,
      sellerCode,
      createdAt: now,
    });
  }

  if (!userProfile.sellerRole) {
    await updateSellerProfile(sellerId, {
      sellerRole: role,
      ...(data.bio ? { sellerProfile: { bio: data.bio.trim() } } : {}),
    });
  }
}

export async function isServiceProfileComplete(sellerId: string, role: Role): Promise<boolean> {
  const profile = await getServiceProfile(sellerId, role);
  return profile?.isComplete === true;
}
