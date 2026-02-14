import type { Timestamp } from 'firebase/firestore';
import type { Role } from './role.js';

export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'completed'
  | 'cancelled';

export interface Booking {
  id: string;
  bookerId: string;
  bookerRole: Role;
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
