/** Service type for sellers (influencer, videographer, editor, model). */
export type Role =
  | 'influencer'
  | 'videographer'
  | 'editor'
  | 'model';

export const SELLER_ROLES: Role[] = [
  'influencer',
  'videographer',
  'editor',
  'model',
];

export function isRole(s: string): s is Role {
  return SELLER_ROLES.includes(s as Role);
}

/** Account type at registration: buyer or seller. */
export type AccountType = 'buyer' | 'seller';

export const ACCOUNT_TYPES: AccountType[] = ['buyer', 'seller'];

export function isAccountType(s: string): s is AccountType {
  return ACCOUNT_TYPES.includes(s as AccountType);
}

/** Seller-only: current mode (selling or buying). */
export type SellerMode = 'selling' | 'buying';

export const SELLER_MODES: SellerMode[] = ['selling', 'buying'];

export function isSellerMode(s: string): s is SellerMode {
  return SELLER_MODES.includes(s as SellerMode);
}

/** Legacy role value in Firestore (for backward compatibility when migrating). */
export type LegacyRole = 'buyer' | Role;

export const LEGACY_ROLES: LegacyRole[] = ['buyer', ...SELLER_ROLES];

export function isLegacyRole(s: string): s is LegacyRole {
  return LEGACY_ROLES.includes(s as LegacyRole);
}
