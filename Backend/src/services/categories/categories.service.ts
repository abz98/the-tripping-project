/**
 * Category Service
 */

import mongoose from "mongoose";
import { Category } from "../../models/category/category.model.js";
import { CategoryValidationError, CategoryNotFoundError } from "./categories.errors.js";

type CategoryType = "EXPERIENCE" | "DESTINATION" | "SEASON";

export interface CreateCategoryDTO {
  name: string;
  type: CategoryType;
  icon_url: string;
}

export interface UpdateCategoryDTO {
  name?: string;
  type?: CategoryType;
  icon_url?: string;
  is_active?: boolean;
}

export interface CategoryResponse {
  id: string;
  name: string;
  type: CategoryType;
  icon_url: string;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VALID_TYPES: CategoryType[] = ["EXPERIENCE", "DESTINATION", "SEASON"];

function normalizeType(type: string): CategoryType | null {
  const upperType = type.toUpperCase() as CategoryType;
  return VALID_TYPES.includes(upperType) ? upperType : null;
}

function validateCreateCategory(data: CreateCategoryDTO): void {
  const errors: Record<string, string> = {};

  if (!data.name?.trim()) errors.name = "Name is required";

  if (!data.type) {
    errors.type = "Type is required (EXPERIENCE, DESTINATION, or SEASON)";
  } else {
    const normalizedType = normalizeType(data.type);
    if (!normalizedType) {
      errors.type = "Type must be one of: EXPERIENCE, DESTINATION, or SEASON";
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new CategoryValidationError("Validation failed", errors);
  }
}

function validateUpdateCategory(data: UpdateCategoryDTO): void {
  if (data.type) {
    const normalizedType = normalizeType(data.type);
    if (!normalizedType) {
      throw new CategoryValidationError("Invalid type", {
        type: "Type must be one of: EXPERIENCE, DESTINATION, or SEASON",
      });
    }
  }
}

function toCategoryResponse(cat: any): CategoryResponse {
  return {
    id: (cat._id as mongoose.Types.ObjectId).toString(),
    name: cat.name,
    type: cat.type,
    icon_url: cat.icon_url,
    is_active: cat.is_active,
    createdAt: cat.createdAt,
    updatedAt: cat.updatedAt,
  };
}

export const categoryService = {
  async create(data: CreateCategoryDTO): Promise<CategoryResponse> {
    // Validate input
    validateCreateCategory(data);

    // Normalize type to uppercase
    data.type = normalizeType(data.type)!;

    // Check for existing category with same name
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${data.name.trim()}$`, "i") },
    });

    if (existingCategory) {
      throw new CategoryValidationError("Category name already exists", {
        name: "Category with this name already exists",
      });
    }

    const category = await Category.create({
      ...data,
      name: data.name.trim(),
      is_active: true,
    });

    return toCategoryResponse(category);
  },

  async list(): Promise<CategoryResponse[]> {
    const categories = await Category.find().sort({ createdAt: -1 });
    return categories.map(toCategoryResponse);
  },

  async update(id: string, data: UpdateCategoryDTO): Promise<CategoryResponse> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CategoryNotFoundError();
    }

    const category = await Category.findById(id);
    if (!category) {
      throw new CategoryNotFoundError();
    }

    // Validate and normalize type if provided
    validateUpdateCategory(data);
    if (data.type) {
      data.type = normalizeType(data.type)!;
    }

    // Check for duplicate name if name is being updated
    if (data.name && data.name.trim() !== category.name) {
      const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${data.name.trim()}$`, "i") },
        _id: { $ne: id },
      });

      if (existingCategory) {
        throw new CategoryValidationError("Category name already exists", {
          name: "Category with this name already exists",
        });
      }
    }

    Object.assign(category, data);
    await category.save();

    return toCategoryResponse(category);
  },

  async delete(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CategoryNotFoundError();
    }

    const result = await Category.findByIdAndDelete(id);
    if (!result) {
      throw new CategoryNotFoundError();
    }
  },
};

export default categoryService;
