import { describe, it, expect } from 'vitest';
import { canBook } from './canBook';
import type { UserProfile } from '../types/user';

function userProfile(overrides: Partial<UserProfile> & { id: string }): UserProfile {
  return {
    id: overrides.id,
    userCode: 'uc',
    email: 'e@e.com',
    accountType: 'user',
    canBuy: false,
    ...overrides,
  };
}

function sellerProfile(
  overrides: Partial<UserProfile> & { id: string; mode?: 'selling' | 'buying' }
): UserProfile {
  return {
    id: overrides.id,
    userCode: 'uc',
    email: 'e@e.com',
    accountType: 'seller',
    sellerCode: 'sc',
    sellerRole: 'influencer',
    mode: 'selling',
    ...overrides,
  };
}

describe('canBook', () => {
  it('returns false when bookerId === providerId (self-booking)', () => {
    const seller = sellerProfile({ id: 'uid-1' });
    expect(canBook(seller, seller, 'uid-1', 'uid-1')).toBe(false);
    const user = userProfile({ id: 'uid-1', canBuy: true });
    expect(canBook(user, seller, 'uid-1', 'uid-1')).toBe(false);
  });

  it('returns false when booker or provider profile is null', () => {
    const seller = sellerProfile({ id: 'uid-2' });
    const user = userProfile({ id: 'uid-1', canBuy: true });
    expect(canBook(null, seller, 'uid-1', 'uid-2')).toBe(false);
    expect(canBook(user, null, 'uid-1', 'uid-2')).toBe(false);
  });

  it('returns false when provider is not a seller', () => {
    const user = userProfile({ id: 'uid-1', canBuy: true });
    const otherUser = userProfile({ id: 'uid-2' });
    expect(canBook(user, otherUser, 'uid-1', 'uid-2')).toBe(false);
  });

  it('returns true when booker is user with canBuy and provider is seller', () => {
    const user = userProfile({ id: 'uid-1', canBuy: true });
    const seller = sellerProfile({ id: 'uid-2' });
    expect(canBook(user, seller, 'uid-1', 'uid-2')).toBe(true);
  });

  it('returns false when booker is user without canBuy', () => {
    const user = userProfile({ id: 'uid-1', canBuy: false });
    const seller = sellerProfile({ id: 'uid-2' });
    expect(canBook(user, seller, 'uid-1', 'uid-2')).toBe(false);
  });

  it('returns true when booker is seller in buying mode and provider is seller', () => {
    const booker = sellerProfile({ id: 'uid-1', mode: 'buying' });
    const provider = sellerProfile({ id: 'uid-2' });
    expect(canBook(booker, provider, 'uid-1', 'uid-2')).toBe(true);
  });

  it('returns false when booker is seller in selling mode', () => {
    const booker = sellerProfile({ id: 'uid-1', mode: 'selling' });
    const provider = sellerProfile({ id: 'uid-2' });
    expect(canBook(booker, provider, 'uid-1', 'uid-2')).toBe(false);
  });

  it('returns false when provider has no sellerRole (incomplete seller)', () => {
    const user = userProfile({ id: 'uid-1', canBuy: true });
    const incompleteSeller = sellerProfile({ id: 'uid-2', sellerRole: undefined });
    expect(canBook(user, incompleteSeller, 'uid-1', 'uid-2')).toBe(false);
  });
});
