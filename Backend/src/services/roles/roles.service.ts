/**
 * Role Service
 * Handles role management business logic
 */

import mongoose from "mongoose";
import { Role } from "../../models/roles/roles.model.js";
import { RoleValidationError, RoleNotFoundError, RoleConflictError } from "./roles.errors.js";

export interface CreateRoleDTO {
  name: string;
  permissions?: Record<string, unknown>;
}

export interface UpdateRoleDTO {
  name?: string;
  permissions?: Record<string, unknown>;
}

export interface RoleResponse {
  id: string;
  name: string;
  permissions: Record<string, unknown>;
  is_active: boolean;
  createdAt: Date;
}

function toRoleResponse(role: any): RoleResponse {
  return {
    id: (role._id as mongoose.Types.ObjectId).toString(),
    name: role.name,
    permissions: role.permissions || {},
    is_active: role.is_active,
    createdAt: role.createdAt,
  };
}

export const roleService = {
  async create(data: CreateRoleDTO): Promise<RoleResponse> {
    if (!data.name || data.name.trim() === "") {
      throw new RoleValidationError("Role name is required", {
        name: "Role name is required",
      });
    }

    const existingRole = await Role.findOne({
      name: data.name.toUpperCase(),
    });
    if (existingRole) {
      throw new RoleConflictError(`Role '${data.name}' already exists`);
    }

    const role = await Role.create({
      name: data.name.toUpperCase(),
      permissions: data.permissions || {},
      is_active: true,
    });

    return toRoleResponse(role);
  },

  async list(): Promise<RoleResponse[]> {
    const roles = await Role.find().sort({ createdAt: -1 });
    return roles.map(toRoleResponse);
  },

  async update(id: string, data: UpdateRoleDTO): Promise<RoleResponse> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new RoleNotFoundError("Role not found");
    }

    const role = await Role.findById(id);
    if (!role) {
      throw new RoleNotFoundError("Role not found");
    }

    if (data.name !== undefined) {
      if (data.name.trim() === "") {
        throw new RoleValidationError("Role name cannot be empty", {
          name: "Role name cannot be empty",
        });
      }

      const existingRole = await Role.findOne({
        name: data.name.toUpperCase(),
        _id: { $ne: id },
      });
      if (existingRole) {
        throw new RoleConflictError(`Role '${data.name}' already exists`);
      }

      role.name = data.name.toUpperCase();
    }

    if (data.permissions !== undefined) {
      role.permissions = data.permissions;
    }

    await role.save();
    return toRoleResponse(role);
  },

  async toggleStatus(id: string): Promise<RoleResponse> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new RoleNotFoundError("Role not found");
    }

    const role = await Role.findById(id);
    if (!role) {
      throw new RoleNotFoundError("Role not found");
    }

    role.is_active = !role.is_active;
    await role.save();

    return toRoleResponse(role);
  },
};

export default roleService;
