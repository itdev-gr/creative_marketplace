import type { Timestamp } from 'firebase/firestore';

export interface Listing {
  id: string;
  sellerId: string;
  title: string;
  description?: string;
  createdAt: Timestamp;
}
