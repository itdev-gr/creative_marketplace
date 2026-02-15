import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import type { Role } from '../types/role.js';
import { SELLER_ROLES } from '../types/role.js';

const SERVICE_PROFILES_COLLECTION = 'serviceProfiles';
const DEFAULT_LIMIT = 20;

export interface CreatorCard {
  id: string;
  sellerCode: string;
  displayName: string;
  role: Role;
}

function docToCreatorCard(id: string, data: Record<string, unknown>): CreatorCard | null {
  const sellerId = data?.sellerId as string | undefined;
  const sellerCode = data?.sellerCode as string | undefined;
  const role = data?.role as Role | undefined;
  if (!sellerId || !sellerCode || !role || !SELLER_ROLES.includes(role)) return null;
  return {
    id: sellerId,
    sellerCode,
    displayName: (data?.displayName as string) ?? 'Creator',
    role,
  };
}

/** Returns creators (sellers) that have a complete service profile for the given role. */
export async function getCreatorsByRole(role: Role, options?: { limit?: number }): Promise<CreatorCard[]> {
  const limitN = options?.limit ?? DEFAULT_LIMIT;
  if (!SELLER_ROLES.includes(role)) return [];

  const q = query(
    collection(db, SERVICE_PROFILES_COLLECTION),
    where('role', '==', role),
    where('isComplete', '==', true),
    orderBy('createdAt', 'desc'),
    limit(limitN)
  );
  const snapshot = await getDocs(q);
  const result: CreatorCard[] = [];
  snapshot.forEach((docSnap) => {
    const card = docToCreatorCard(docSnap.id, docSnap.data());
    if (card) result.push(card);
  });
  return result;
}

export async function getCreators(options?: { limit?: number }): Promise<CreatorCard[]> {
  const limitN = options?.limit ?? DEFAULT_LIMIT;
  const q = query(
    collection(db, SERVICE_PROFILES_COLLECTION),
    where('isComplete', '==', true),
    orderBy('createdAt', 'desc'),
    limit(limitN)
  );
  const snapshot = await getDocs(q);
  const result: CreatorCard[] = [];
  snapshot.forEach((docSnap) => {
    const card = docToCreatorCard(docSnap.id, docSnap.data());
    if (card) result.push(card);
  });
  return result;
}
