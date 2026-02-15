import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebase/config.js';
import type { Listing } from '../types/listing.js';

const LISTINGS_COLLECTION = 'listings';

function snapshotToListing(id: string, data: Record<string, unknown>): Listing {
  return {
    id,
    sellerId: data.sellerId as string,
    title: (data.title as string) ?? '',
    description: data.description as string | undefined,
    createdAt: data.createdAt as import('firebase/firestore').Timestamp,
  };
}

export async function getListingsBySeller(sellerId: string): Promise<Listing[]> {
  const q = query(
    collection(db, LISTINGS_COLLECTION),
    where('sellerId', '==', sellerId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => snapshotToListing(d.id, d.data()));
}

export async function createListing(
  sellerId: string,
  data: { title: string; description?: string }
): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid || uid !== sellerId) throw new Error('Unauthorized');

  const ref = await addDoc(collection(db, LISTINGS_COLLECTION), {
    sellerId,
    title: data.title.trim(),
    description: data.description?.trim() || null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateListing(
  listingId: string,
  sellerId: string,
  data: { title: string; description?: string }
): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid || uid !== sellerId) throw new Error('Unauthorized');

  const ref = doc(db, LISTINGS_COLLECTION, listingId);
  const snap = await getDoc(ref);
  if (!snap.exists() || (snap.data()?.sellerId as string) !== sellerId) throw new Error('Listing not found');

  await updateDoc(ref, {
    title: data.title.trim(),
    description: data.description?.trim() || null,
  });
}

export async function deleteListing(listingId: string, sellerId: string): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid || uid !== sellerId) throw new Error('Unauthorized');

  const ref = doc(db, LISTINGS_COLLECTION, listingId);
  const snap = await getDoc(ref);
  if (!snap.exists() || (snap.data()?.sellerId as string) !== sellerId) throw new Error('Listing not found');

  await deleteDoc(ref);
}
