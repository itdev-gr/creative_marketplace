import type { Role } from './role.js';

export interface UserProfile {
  id: string;
  role: Role;
  email: string;
  displayName?: string;
  createdAt?: unknown;
}
