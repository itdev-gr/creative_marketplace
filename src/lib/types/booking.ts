import type { Timestamp } from 'firebase/firestore';
import type { Role } from './role.js';

/** For booking docs: booker is either a 'buyer' (canBuy) or a seller in buying mode (we store their sellerRole). */
export type BookerRole = 'buyer' | Role;

export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'completed'
  | 'cancelled';

export interface Booking {
  id: string;
  bookerId: string;
  bookerRole: BookerRole;
  providerId: string;
  providerRole: Role;
  date: Timestamp;
  status: BookingStatus;
  createdAt: Timestamp;
}

export const BOOKING_STATUSES: BookingStatus[] = [
  'pending',
  'accepted',
  'rejected',
  'completed',
  'cancelled',
];
