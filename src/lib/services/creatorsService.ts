import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import type { Role } from '../types/role.js';
import { isRole } from '../types/role.js';

const USERS_COLLECTION = 'users';
const SELLER_ROLES: Role[] = ['influencer', 'videographer', 'editor', 'model'];
const DEFAULT_LIMIT = 20;

export interface CreatorCard {
  id: string;
  sellerCode: string;
  displayName: string;
  role: Role;
}

function docToCreatorCard(id: string, data: Record<string, unknown>): CreatorCard | null {
  if (data?.accountType !== 'seller') return null;
  const sellerCode = data?.sellerCode as string | undefined;
  const role = data?.sellerRole;
  if (!sellerCode || !role || !isRole(role) || !SELLER_ROLES.includes(role)) return null;
  return {
    id,
    sellerCode,
    displayName: (data?.displayName as string) ?? 'Creator',
    role,
  };
}

export async function getCreatorsByRole(role: Role, options?: { limit?: number }): Promise<CreatorCard[]> {
  const limitN = options?.limit ?? DEFAULT_LIMIT;
  if (!SELLER_ROLES.includes(role)) return [];

  const q = query(
    collection(db, USERS_COLLECTION),
    where('accountType', '==', 'seller'),
    where('sellerRole', '==', role),
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
    collection(db, USERS_COLLECTION),
    where('accountType', '==', 'seller'),
    where('sellerRole', 'in', SELLER_ROLES),
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
