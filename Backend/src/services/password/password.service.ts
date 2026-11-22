/**
 * Password Service
 * Handles password hashing and verification using bcrypt
 *
 * Requirements:
 * - 7.1: Hash passwords using bcrypt with configurable cost factor (minimum 10)
 * - 7.2: Compare provided password against stored hash and return boolean
 * - 7.4: For all passwords, hashing then verifying with same password SHALL return true
 * - 7.5: For all different passwords, verifying a hash with different password SHALL return false
 */

import * as bcrypt from "bcrypt";

/**
 * Interface for the Password Service
 */
export interface IPasswordService {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}

/**
 * Cost factor for bcrypt hashing
 * Minimum of 10 as per requirement 7.1
 */
const BCRYPT_COST_FACTOR = 10;

/**
 * Password Service implementation
 * Provides secure password hashing and verification using bcrypt
 */
export const passwordService: IPasswordService = {
  /**
   * Hash a password using bcrypt
   * @param password - The plaintext password to hash
   * @returns Promise resolving to the hashed password
   */
  async hash(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(BCRYPT_COST_FACTOR);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  },

  /**
   * Verify a password against a stored hash
   * @param password - The plaintext password to verify
   * @param hash - The stored bcrypt hash to compare against
   * @returns Promise resolving to true if password matches, false otherwise
   */
  async verify(password: string, hash: string): Promise<boolean> {
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  },
};

export default passwordService;
