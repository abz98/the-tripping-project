/**
 * Type definitions for Express Request augmentation
 * Extends Express Request interface with user property for authenticated requests
 */

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
        email: string;
        name: string;
      };
    }
  }
}

/**
 * AuthenticatedRequest type for use in route handlers
 * Guarantees that the user property is present (non-optional)
 */
export interface AuthenticatedRequest extends Express.Request {
  user: {
    userId: string;
    role: string;
    email: string;
    name: string;
  };
}

export {};
