/**
 * Role constants for RBAC (Role-Based Access Control)
 * These roles define the permission levels in the system
 */

export const ROLES = {
  ADMIN: "ADMIN",
  HOST: "HOST",
  USER:"USER",
  TRAVELLER: "TRAVELLER",
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

/**
 * Array of all valid role names for validation purposes
 */
export const VALID_ROLES: RoleName[] = Object.values(ROLES);

/**
 * Default role assigned to new users during registration
 */
export const DEFAULT_ROLE: RoleName = ROLES.TRAVELLER;
