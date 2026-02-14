import type { UserProfile } from '../types/user.js';

/**
 * Determines if the current user (booker) can book the provider.
 * - Booker can book if: (user with canBuy === true) OR (seller with mode === 'buying').
 * - Provider must be a seller (accountType === 'seller' with sellerRole).
 * - No self-booking.
 */
export function canBook(
  bookerProfile: UserProfile | null,
  providerProfile: UserProfile | null,
  bookerId: string,
  providerId: string
): boolean {
  if (bookerId === providerId) return false;
  if (!bookerProfile || !providerProfile) return false;

  const providerIsSeller =
    providerProfile.accountType === 'seller' &&
    providerProfile.sellerCode != null &&
    providerProfile.sellerRole != null;
  if (!providerIsSeller) return false;

  const bookerCanActAsBuyer =
    (bookerProfile.accountType === 'user' && bookerProfile.canBuy === true) ||
    (bookerProfile.accountType === 'seller' && bookerProfile.mode === 'buying');

  return bookerCanActAsBuyer;
}
