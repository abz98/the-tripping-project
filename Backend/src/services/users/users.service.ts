/**
 * User Service
 * Handles user profile management
 */

import mongoose from "mongoose";
import { User } from "../../models/users/users.model.js";
import { Role } from "../../models/roles/roles.model.js";
import { passwordService } from "../password/password.service.js";
import { DEFAULT_ROLE } from "../../constants/roles.js";
import { UserValidationError, UserNotFoundError, UserAuthenticationError } from "./users.errors.js";

export interface UpdateProfileDTO {
  full_name?: string;
  phone?: string;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  is_verified: boolean;
  createdAt: Date;
}

export const userService = {
  async getProfile(userId: string): Promise<UserProfileResponse> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new UserNotFoundError();
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    const role = await Role.findById(user.role_id);
    const roleName = role?.name || DEFAULT_ROLE;

    return {
      id: (user._id as mongoose.Types.ObjectId).toString(),
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      role: roleName,
      is_verified: user.is_verified,
      createdAt: user.createdAt,
    };
  },

  async updateProfile(userId: string, data: UpdateProfileDTO): Promise<UserProfileResponse> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new UserNotFoundError();
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    if (data.full_name !== undefined) {
      if (data.full_name.trim() === "") {
        throw new UserValidationError("Full name cannot be empty", {
          full_name: "Full name cannot be empty",
        });
      }
      user.full_name = data.full_name.trim();
    }

    if (data.phone !== undefined) {
      user.phone = data.phone;
    }

    await user.save();

    const role = await Role.findById(user.role_id);
    const roleName = role?.name || DEFAULT_ROLE;

    return {
      id: (user._id as mongoose.Types.ObjectId).toString(),
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      role: roleName,
      is_verified: user.is_verified,
      createdAt: user.createdAt,
    };
  },

  async changePassword(userId: string, data: ChangePasswordDTO): Promise<void> {
    if (!data.currentPassword || data.currentPassword === "") {
      throw new UserValidationError("Current password is required", {
        currentPassword: "Current password is required",
      });
    }

    if (!data.newPassword || data.newPassword === "") {
      throw new UserValidationError("New password is required", {
        newPassword: "New password is required",
      });
    }

    if (data.newPassword.length < 8) {
      throw new UserValidationError("New password must be at least 8 characters", {
        newPassword: "New password must be at least 8 characters",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new UserNotFoundError();
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    const isValid = await passwordService.verify(data.currentPassword, user.password_hash);
    if (!isValid) {
      throw new UserAuthenticationError("Current password is incorrect");
    }

    user.password_hash = await passwordService.hash(data.newPassword);
    await user.save();
  },
};

export default userService;
