/**
 * Admin User Routes
 */

import { Router, Request, Response } from "express";
import { authenticate } from "../../../middlewares/auth.middleware.js";
import { authorize } from "../../../middlewares/rbac.middleware.js";
import { HTTP_STATUS } from "../../../constants/statusCodes.js";
import { MESSAGES } from "../../../constants/messages.js";

const router = Router();

// Get All Users (Admin)
router.get(
  "/admin/users",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const { User } = await import("../../../models/users/users.model.js");
      const currentUserId = (req as any).user.userId;

      // Get query parameters
      const role = req.query.role as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      const search = req.query.search as string;

      // Build query - exclude current logged-in user
      const query: any = {
        _id: { $ne: currentUserId },
      };

      if (role) {
        query.role = role;
      }

      if (search) {
        query.$or = [
          { full_name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ];
      }

      // Get users with pagination
      const [users, total] = await Promise.all([
        User.find(query)
          .select("-password -refresh_token")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(query),
      ]);

      // Get all unique role IDs
      const roleIds = [
        ...new Set(users.map((user: any) => user.role_id?.toString()).filter(Boolean)),
      ];

      // Fetch all roles
      const { Role } = await import("../../../models/roles/roles.model.js");
      const roles = await Role.find({ _id: { $in: roleIds } }).select("name");
      const roleMap = new Map(roles.map((r: any) => [r._id.toString(), r]));

      const formattedUsers = users.map((user: any) => {
        const role = user.role_id ? roleMap.get(user.role_id.toString()) : null;
        return {
          id: user._id.toString(),
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          role_id: user.role_id?.toString(),
          role_name: role?.name,
          is_verified: user.is_verified,
          is_active: user.is_active,
          profile_picture: user.profile_picture,
          date_of_birth: user.date_of_birth,
          gender: user.gender,
          address: user.address,
          city: user.city,
          state: user.state,
          country: user.country,
          pincode: user.pincode,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
      });

      res.status(HTTP_STATUS.OK).json({
        status: "success",
        message: MESSAGES.SUCCESS.FETCHED,
        data: formattedUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + users.length < total,
        },
      });
    } catch (error: any) {
      console.error("Get all users error:", error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: error.message || MESSAGES.ERROR.INTERNAL_SERVER,
        error: { code: "INTERNAL_ERROR" },
      });
    }
  },
);

// Get User by ID (Admin)
router.get(
  "/admin/users/:id",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const { User } = await import("../../../models/users/users.model.js");
      const userId = req.params.id;

      const user = await User.findById(userId).select("-password -refresh_token").lean();

      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: "error",
          message: "User not found",
          error: { code: "USER_NOT_FOUND" },
        });
      }

      // Fetch role if role_id exists
      let roleName = null;
      if (user.role_id) {
        const { Role } = await import("../../../models/roles/roles.model.js");
        const role = await Role.findById(user.role_id).select("name");
        roleName = role?.name;
      }

      res.status(HTTP_STATUS.OK).json({
        status: "success",
        message: MESSAGES.SUCCESS.FETCHED,
        data: {
          id: user._id.toString(),
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          role_id: user.role_id?.toString(),
          role_name: roleName,
          is_verified: user.is_verified,
          is_active: user.is_active,
          profile_picture: user.profile_picture,
          date_of_birth: user.date_of_birth,
          gender: user.gender,
          address: user.address,
          city: user.city,
          state: user.state,
          country: user.country,
          pincode: user.pincode,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error: any) {
      console.error("Get user by ID error:", error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: error.message || MESSAGES.ERROR.INTERNAL_SERVER,
        error: { code: "INTERNAL_ERROR" },
      });
    }
  },
);

export default router;

// Update User Role (Admin)
router.patch(
  "/admin/users/:id/role",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const { User } = await import("../../../models/users/users.model.js");
      const { Role } = await import("../../../models/roles/roles.model.js");
      const userId = req.params.id;
      const { role_name } = req.body;

      // Validate role_name
      if (!role_name) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: "error",
          message: "Role name is required",
          error: {
            code: "VALIDATION_ERROR",
            details: {
              role_name: "Role name is required (e.g., ADMIN, HOST, USER)",
            },
          },
        });
      }

      // Find the role by name
      const role = await Role.findOne({ name: role_name.toUpperCase() });
      if (!role) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: "error",
          message: "Invalid role",
          error: {
            code: "VALIDATION_ERROR",
            details: {
              role_name: "Role not found. Valid roles: ADMIN, HOST, USER",
            },
          },
        });
      }

      // Find and update user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: "error",
          message: "User not found",
          error: { code: "USER_NOT_FOUND" },
        });
      }

      // Prevent changing own role
      const currentUserId = (req as any).user.userId;
      if (userId === currentUserId) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          status: "error",
          message: "Cannot change your own role",
          error: { code: "FORBIDDEN" },
        });
      }

      const oldRoleId = user.role_id;
      const oldRole = oldRoleId ? await Role.findById(oldRoleId) : null;

      user.role_id = role._id;
      user.role = role_name.toUpperCase();
      await user.save();

      res.status(HTTP_STATUS.OK).json({
        status: "success",
        message: "User role updated successfully",
        data: {
          id: user._id.toString(),
          full_name: user.full_name,
          email: user.email,
          oldRole: oldRole?.name || null,
          newRole: role.name,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error: any) {
      console.error("Update user role error:", error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: error.message || MESSAGES.ERROR.INTERNAL_SERVER,
        error: { code: "INTERNAL_ERROR" },
      });
    }
  },
);
