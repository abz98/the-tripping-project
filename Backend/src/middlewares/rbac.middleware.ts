/**
 * RBAC (Role-Based Access Control) Middleware
 * Enforces role-based access control on protected routes
 *
 * Requirements:
 * - 6.1: RBAC middleware SHALL allow request if user has permitted role
 * - 6.2: RBAC middleware SHALL reject with 403 forbidden if user has non-permitted role
 * - 6.3: RBAC middleware SHALL permit access if user has any one of the allowed roles
 * - 6.4: RBAC middleware SHALL reject with 401 if request has no user context (unauthenticated)
 */

import { Request, Response, NextFunction, RequestHandler } from "express";
import { RoleName } from "../constants/roles.js";
import { HTTP_STATUS } from "../constants/statusCodes.js";
import { MESSAGES } from "../constants/messages.js";

/**
 * Factory function that creates RBAC middleware for specified roles
 *
 * @param allowedRoles - List of roles that are permitted to access the route
 * @returns Express middleware function that enforces role-based access control
 *
 * Usage:
 * ```typescript
 * router.get('/admin', authenticate, authorize('ADMIN'), adminHandler);
 * router.get('/host-or-admin', authenticate, authorize('ADMIN', 'HOST'), handler);
 * ```
 *
 * Error responses:
 * - 401: No user context on request (Requirement 6.4)
 * - 403: User role not in allowed roles (Requirement 6.2)
 */
export function authorize(...allowedRoles: RoleName[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if request has user context (Requirement 6.4)
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        status: "error",
        message: MESSAGES.AUTH.UNAUTHORIZED,
        error: { code: "AUTHENTICATION_ERROR" },
      });
      return;
    }

    const userRole = req.user.role as RoleName;

    // Always allow ADMIN role
    if (userRole === 'ADMIN') {
      next();
      return;
    }

    // Check if user role is in allowed roles (Requirements 6.1, 6.2, 6.3)
    if (allowedRoles.includes(userRole)) {
      // Requirement 6.1: Allow request if user has permitted role
      // Requirement 6.3: Permit access if user has any one of the allowed roles
      next();
      return;
    }

    // Requirement 6.2: Reject with 403 forbidden if user has non-permitted role
    res.status(HTTP_STATUS.FORBIDDEN).json({
      status: "error",
      message: MESSAGES.AUTH.INSUFFICIENT_PERMISSIONS,
      error: { code: "AUTHORIZATION_ERROR" },
    });
  };
}

export default authorize;
