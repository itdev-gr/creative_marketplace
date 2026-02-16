import type { Timestamp } from 'firebase/firestore';
import type { Role } from './role.js';

export interface Listing {
  id: string;
  sellerId: string;
  title: string;
  description?: string;
  /** Price, e.g. "50€/hour". */
  price?: string | null;
  /** When set, listing is associated with a service profile (role). */
  role?: Role;
  createdAt: Timestamp;
}
