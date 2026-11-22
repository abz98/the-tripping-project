import { Router, Request, Response } from "express";
import { authenticate } from "../../../middlewares/auth.middleware.js";
import { authorize } from "../../../middlewares/rbac.middleware.js";
import { roleService } from "../../../services/roles/roles.service.js";
import {
  RoleError,
  RoleValidationError,
  RoleNotFoundError,
  RoleConflictError,
} from "../../../services/roles/roles.errors.js";
import { HTTP_STATUS } from "../../../constants/statusCodes.js";
import { MESSAGES } from "../../../constants/messages.js";

const router = Router();

function handleRoleError(error: unknown, res: Response): void {
  if (error instanceof RoleValidationError) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      status: "error",
      message: error.message,
      error: { code: error.code, details: error.details },
    });
    return;
  }

  if (error instanceof RoleNotFoundError) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      status: "error",
      message: error.message,
      error: { code: error.code },
    });
    return;
  }

  if (error instanceof RoleConflictError) {
    res.status(HTTP_STATUS.CONFLICT).json({
      status: "error",
      message: error.message,
      error: { code: error.code },
    });
    return;
  }

  if (error instanceof RoleError) {
    res.status(error.statusCode).json({
      status: "error",
      message: error.message,
      error: { code: error.code },
    });
    return;
  }

  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    status: "error",
    message: MESSAGES.ERROR.INTERNAL_SERVER,
    error: { code: "INTERNAL_ERROR" },
  });
}

// Create Role - POST /admin/roles
router.post(
  "/admin/roles",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const role = await roleService.create(req.body);
      res.status(HTTP_STATUS.CREATED).json({
        status: "success",
        message: MESSAGES.SUCCESS.CREATED,
        data: role,
      });
    } catch (error) {
      handleRoleError(error, res);
    }
  },
);

// List Roles - GET /admin/roles
router.get(
  "/admin/roles",
  authenticate,
  authorize("ADMIN"),
  async (_req: Request, res: Response) => {
    try {
      const roles = await roleService.list();
      res.status(HTTP_STATUS.OK).json({
        status: "success",
        message: MESSAGES.SUCCESS.FETCHED,
        data: roles,
      });
    } catch (error) {
      handleRoleError(error, res);
    }
  },
);

// Update Role - PUT /admin/roles/:id
router.put(
  "/admin/roles/:id",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const role = await roleService.update(req.params.id, req.body);
      res.status(HTTP_STATUS.OK).json({
        status: "success",
        message: MESSAGES.SUCCESS.UPDATED,
        data: role,
      });
    } catch (error) {
      handleRoleError(error, res);
    }
  },
);

// Activate/Deactivate Role - PATCH /admin/roles/:id/status
router.patch(
  "/admin/roles/:id/status",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const role = await roleService.toggleStatus(req.params.id);
      res.status(HTTP_STATUS.OK).json({
        status: "success",
        message: MESSAGES.SUCCESS.UPDATED,
        data: role,
      });
    } catch (error) {
      handleRoleError(error, res);
    }
  },
);

export default router;
