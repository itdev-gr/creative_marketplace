import type { Timestamp } from 'firebase/firestore';
import type { Role } from './role.js';

export interface Listing {
  id: string;
  sellerId: string;
  title: string;
  description?: string;
  /** When set, listing is associated with a service profile (role). */
  role?: Role;
  createdAt: Timestamp;
}
