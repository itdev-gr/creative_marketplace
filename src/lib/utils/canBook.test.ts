import { describe, it, expect } from 'vitest';
import { canBook } from './canBook';
import type { Role } from '../types/role';

const roles: Role[] = ['user', 'influencer', 'videographer', 'editor', 'model'];
const creativeRoles: Role[] = ['influencer', 'videographer', 'editor', 'model'];

describe('canBook', () => {
  it('returns false when bookerId === targetId (self-booking)', () => {
    for (const role of roles) {
      expect(canBook(role, role, 'uid-1', 'uid-1')).toBe(false);
    }
    expect(canBook('user', 'influencer', 'uid-1', 'uid-1')).toBe(false);
  });

  it('returns false when targetRole is "user" (nobody can book a user)', () => {
    for (const bookerRole of roles) {
      expect(canBook(bookerRole, 'user', 'uid-1', 'uid-2')).toBe(false);
    }
  });

  it('returns true when booker is "user" and target is any creative role', () => {
    for (const targetRole of creativeRoles) {
      expect(canBook('user', targetRole, 'uid-1', 'uid-2')).toBe(true);
    }
  });

  it('returns true when both are creative roles (different ids)', () => {
    for (const bookerRole of creativeRoles) {
      for (const targetRole of creativeRoles) {
        expect(canBook(bookerRole, targetRole, 'uid-1', 'uid-2')).toBe(true);
      }
    }
  });

  it('returns true when same creative role books another same role', () => {
    expect(canBook('influencer', 'influencer', 'uid-1', 'uid-2')).toBe(true);
    expect(canBook('videographer', 'videographer', 'uid-a', 'uid-b')).toBe(true);
  });

  it('returns false when user books user', () => {
    expect(canBook('user', 'user', 'uid-1', 'uid-2')).toBe(false);
  });
});
