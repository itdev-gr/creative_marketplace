import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '../firebase/config.js';

const USERS_COLLECTION = 'users';
const MAX_RETRIES = 5;

function generateCode(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 10);
}

/**
 * Returns a unique userCode not yet present in users collection.
 */
export async function generateUniqueUserCode(): Promise<string> {
  for (let i = 0; i < MAX_RETRIES; i++) {
    const code = generateCode();
    const q = query(
      collection(db, USERS_COLLECTION),
      where('userCode', '==', code),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return code;
  }
  throw new Error('Could not generate unique userCode after retries.');
}

/**
 * Returns a unique sellerCode not yet present in users collection.
 */
export async function generateUniqueSellerCode(): Promise<string> {
  for (let i = 0; i < MAX_RETRIES; i++) {
    const code = generateCode();
    const q = query(
      collection(db, USERS_COLLECTION),
      where('sellerCode', '==', code),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return code;
  }
  throw new Error('Could not generate unique sellerCode after retries.');
}
