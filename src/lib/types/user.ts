import type { AccountType } from './role.js';
import type { Role } from './role.js';

export interface UserProfile {
  id: string;
  userCode: string;
  email: string;
  displayName?: string;
  createdAt?: unknown;
  accountType: AccountType;
  /** Present when accountType === 'seller'. */
  sellerCode?: string;
  /** Seller's service type; present when accountType === 'seller'. */
  sellerRole?: Role;
  /** Seller's current mode; present when accountType === 'seller'. Default 'selling'. */
  mode?: 'selling' | 'buying';
  /** User (non-seller) opt-in to allow booking others; present when accountType === 'user'. Default false. */
  canBuy?: boolean;
  /** Optional seller bio etc. */
  sellerProfile?: { bio?: string };
}
