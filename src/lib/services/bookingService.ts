import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { auth, db } from '../firebase/config.js';
import { canBook } from '../utils/canBook.js';
import type { Role } from '../types/role.js';
import type { UserProfile } from '../types/user.js';
import type { Booking, BookingStatus, BookerRole } from '../types/booking.js';
import {
  BookingNotAllowedError,
  PermissionDeniedError,
  BookingNotFoundError,
  ValidationError,
} from '../errors/booking.js';

const BOOKINGS_COLLECTION = 'bookings';
const DEFAULT_PAGE_SIZE = 20;

export interface GetBookingsOptions {
  limit?: number;
  startAfterDoc?: DocumentSnapshot;
}

function toBookerRole(profile: UserProfile): BookerRole {
  if (profile.accountType === 'user') return 'user';
  return (profile.sellerRole as BookerRole) ?? 'influencer';
}

export async function createBooking(
  bookerId: string,
  bookerProfile: UserProfile,
  providerId: string,
  providerProfile: UserProfile,
  date: Date
): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new ValidationError('You must be signed in to create a booking.');
  if (bookerId !== uid) throw new PermissionDeniedError('Booker must be the current user.');

  if (!canBook(bookerProfile, providerProfile, bookerId, providerId)) {
    throw new BookingNotAllowedError();
  }

  const bookerRole = toBookerRole(bookerProfile);
  const providerRole: Role = providerProfile.sellerRole ?? 'influencer';

  const docRef = await addDoc(collection(db, BOOKINGS_COLLECTION), {
    bookerId,
    bookerRole,
    providerId,
    providerRole,
    date: Timestamp.fromDate(date),
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

function snapshotToBooking(
  id: string,
  data: Record<string, unknown>
): Booking {
  return {
    id,
    bookerId: data.bookerId as string,
    bookerRole: data.bookerRole as BookerRole,
    providerId: data.providerId as string,
    providerRole: data.providerRole as Role,
    date: data.date as import('firebase/firestore').Timestamp,
    status: data.status as BookingStatus,
    createdAt: data.createdAt as import('firebase/firestore').Timestamp,
  };
}

/** Fetches bookings where user is booker OR provider; merged and sorted by createdAt desc. */
export async function getBookingsForUser(
  uid: string,
  options: GetBookingsOptions = {}
): Promise<{ bookings: Booking[]; lastDoc: DocumentSnapshot | null }> {
  const pageSize = options.limit ?? DEFAULT_PAGE_SIZE;
  const [bookerRes, providerRes] = await Promise.all([
    getBookingsForUserAsBooker(uid, { limit: pageSize }),
    getBookingsForUserAsProvider(uid, { limit: pageSize }),
  ]);
  const byId = new Map<string, Booking>();
  for (const b of bookerRes.bookings) byId.set(b.id, b);
  for (const b of providerRes.bookings) if (!byId.has(b.id)) byId.set(b.id, b);
  const bookings = [...byId.values()].sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() ?? 0;
    const bTime = b.createdAt?.toMillis?.() ?? 0;
    return bTime - aTime;
  });
  const lastDoc = bookerRes.lastDoc ?? providerRes.lastDoc ?? null;
  return { bookings, lastDoc };
}

export async function getBookingsForUserAsBooker(
  uid: string,
  options: GetBookingsOptions = {}
): Promise<{ bookings: Booking[]; lastDoc: DocumentSnapshot | null }> {
  const pageSize = options.limit ?? DEFAULT_PAGE_SIZE;
  const q = query(
    collection(db, BOOKINGS_COLLECTION),
    where('bookerId', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(pageSize),
    ...(options.startAfterDoc ? [startAfter(options.startAfterDoc)] : [])
  );
  const snapshot = await getDocs(q);
  const bookings = snapshot.docs.map((d) => snapshotToBooking(d.id, d.data()));
  const lastDoc =
    snapshot.docs.length === pageSize ? snapshot.docs[snapshot.docs.length - 1] : null;
  return { bookings, lastDoc };
}

export async function getBookingsForUserAsProvider(
  uid: string,
  options: GetBookingsOptions = {}
): Promise<{ bookings: Booking[]; lastDoc: DocumentSnapshot | null }> {
  const pageSize = options.limit ?? DEFAULT_PAGE_SIZE;
  const q = query(
    collection(db, BOOKINGS_COLLECTION),
    where('providerId', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(pageSize),
    ...(options.startAfterDoc ? [startAfter(options.startAfterDoc)] : [])
  );
  const snapshot = await getDocs(q);
  const bookings = snapshot.docs.map((d) => snapshotToBooking(d.id, d.data()));
  const lastDoc =
    snapshot.docs.length === pageSize ? snapshot.docs[snapshot.docs.length - 1] : null;
  return { bookings, lastDoc };
}

export async function acceptBooking(bookingId: string): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new ValidationError('You must be signed in.');

  const ref = doc(db, BOOKINGS_COLLECTION, bookingId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new BookingNotFoundError();
  const data = snap.data();
  if (data.providerId !== uid) throw new PermissionDeniedError();

  await updateDoc(ref, { status: 'accepted' });
}

export async function rejectBooking(bookingId: string): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new ValidationError('You must be signed in.');

  const ref = doc(db, BOOKINGS_COLLECTION, bookingId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new BookingNotFoundError();
  const data = snap.data();
  if (data.providerId !== uid) throw new PermissionDeniedError();

  await updateDoc(ref, { status: 'rejected' });
}

export async function cancelBooking(bookingId: string): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new ValidationError('You must be signed in.');

  const ref = doc(db, BOOKINGS_COLLECTION, bookingId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new BookingNotFoundError();
  const data = snap.data();
  if (data.bookerId !== uid) throw new PermissionDeniedError();

  await updateDoc(ref, { status: 'cancelled' });
}
