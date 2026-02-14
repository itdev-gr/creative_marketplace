import type { Role } from '../types/role.js';

/**
 * Determines if a user (booker) can book another user (target/provider).
 * Rules:
 * - Cannot book yourself (bookerId === targetId → false)
 * - Cannot book a "user" role (targetRole === "user" → false)
 * - "user" can book any creative role (influencer, videographer, editor, model)
 * - Creative roles can book any other creative role (including same role)
 */
export function canBook(
  bookerRole: Role,
  targetRole: Role,
  bookerId: string,
  targetId: string
): boolean {
  if (bookerId === targetId) return false;
  if (targetRole === 'user') return false;
  if (bookerRole === 'user' && targetRole !== 'user') return true;
  if (bookerRole !== 'user' && targetRole !== 'user') return true;
  return false;
}
