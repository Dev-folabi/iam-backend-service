// src/routes/userRoutes.ts
import { Router } from "express";
import { UserController } from "../controllers/userController";
import { authMiddleware } from "../middleware/auth";
import {
  validateCreateUser,
  validateUpdateUser,
  validateGetUser,
  validatePagination,
} from "../middleware/validation";

const router = Router();
const userController = new UserController();


/**
 * Get all users with pagination
 * GET /api/users
 * Requires: Authentication + (admin OR user:read permission)
 */
router.get(
  "/",
  authMiddleware.authenticate,
  authMiddleware.requireAnyRole(["admin", "moderator"]),
  validatePagination,
  userController.getUsers
);

/**
 * Get user by ID
 * GET /api/users/:id
 * Requires: Authentication + (admin OR own resource OR user:read permission)
 */
router.get(
  "/:id",
  authMiddleware.authenticate,
  validateGetUser,
  authMiddleware.requireOwnershipOrAdmin("id"),
  userController.getUserById
);

/**
 * Create new user
 * POST /api/users
 * Requires: Authentication + admin role + user:create permission
 */
router.post(
  "/",
  authMiddleware.authenticate,
  authMiddleware.requireRole("admin"),
  authMiddleware.requirePermission("user", "create"),
  validateCreateUser,
  userController.createUser
);

/**
 * Update user
 * PUT /api/users/:id
 * Requires: Authentication + (admin OR own resource) + user:update permission
 */
router.put(
  "/:id",
  authMiddleware.authenticate,
  validateUpdateUser,
  authMiddleware.requireOwnershipOrAdmin("id"),
  authMiddleware.requirePermission("user", "update"),
  userController.updateUser
);

/**
 * Delete user
 * DELETE /api/users/:id
 * Requires: Authentication + admin role + user:delete permission
 */
router.delete(
  "/:id",
  authMiddleware.authenticate,
  authMiddleware.requireRole("admin"),
  authMiddleware.requirePermission("user", "delete"),
  validateGetUser,
  userController.deleteUser
);


export default router;
