export type Role =
  | 'user'
  | 'influencer'
  | 'videographer'
  | 'editor'
  | 'model';

export const ROLES: Role[] = [
  'user',
  'influencer',
  'videographer',
  'editor',
  'model',
];

export function isRole(s: string): s is Role {
  return ROLES.includes(s as Role);
}
