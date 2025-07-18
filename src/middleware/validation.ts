import { body, query, param, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { UserStatus } from "../types/enums";
import { createError } from "./errorHandler";

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((error) => error.msg)
      .join(", ");
    throw createError(`Validation failed: ${errorMessages}`, 400);
  }
  next();
};

/**
 * Validation rules for user registration
 */
export const validateRegister = [
  body("username")
    .isLength({ min: 3, max: 50 })
    .withMessage("Username must be between 3 and 50 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),

  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),

  body("status")
    .optional()
    .isIn(Object.values(UserStatus))
    .withMessage(
      `Status must be one of: ${Object.values(UserStatus).join(", ")}`
    ),

  body("roles")
    .optional()
    .isArray()
    .withMessage("Roles must be an array")
    .custom((roles: string[]) => {
      if (roles.some((role) => typeof role !== "string")) {
        throw new Error("All roles must be strings");
      }
      return true;
    }),

  handleValidationErrors,
];

/**
 * Validation rules for user login
 */
export const validateLogin = [
  body("username").notEmpty().withMessage("Username is required").trim(),

  body("password").notEmpty().withMessage("Password is required"),

  handleValidationErrors,
];

/**
 * Validation rules for refresh token
 */
export const validateRefreshToken = [
  body("refreshToken")
    .notEmpty()
    .withMessage("Refresh token is required")
    .isString()
    .withMessage("Refresh token must be a string"),

  handleValidationErrors,
];

/**
 * Validation rules for user creation
 */
export const validateCreateUser = [
  body("username")
    .isLength({ min: 3, max: 50 })
    .withMessage("Username must be between 3 and 50 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),

  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),

  body("status")
    .optional()
    .isIn(Object.values(UserStatus))
    .withMessage(
      `Status must be one of: ${Object.values(UserStatus).join(", ")}`
    ),

  body("roles").optional().isArray().withMessage("Roles must be an array"),

  handleValidationErrors,
];

/**
 * Validation rules for user update
 */
export const validateUpdateUser = [
  param("id").isUUID().withMessage("User ID must be a valid UUID"),

  body("username")
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage("Username must be between 3 and 50 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),

  body("email")
    .optional()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .optional()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),

  body("status")
    .optional()
    .isIn(Object.values(UserStatus))
    .withMessage(
      `Status must be one of: ${Object.values(UserStatus).join(", ")}`
    ),

  body("roles").optional().isArray().withMessage("Roles must be an array"),

  handleValidationErrors,
];

/**
 * Validation rules for getting user by ID
 */
export const validateGetUser = [
  param("id").isUUID().withMessage("User ID must be a valid UUID"),

  handleValidationErrors,
];

/**
 * Validation rules for pagination
 */
export const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),

  query("sortBy")
    .optional()
    .isIn(["username", "email", "status", "createdAt", "updatedAt"])
    .withMessage(
      "Sort by must be one of: username, email, status, createdAt, updatedAt"
    ),

  query("sortOrder")
    .optional()
    .isIn(["ASC", "DESC"])
    .withMessage("Sort order must be ASC or DESC"),

  handleValidationErrors,
];

/**
 * Validation rules for role assignment
 */
export const validateRoleAssignment = [
  param("userId").isUUID().withMessage("User ID must be a valid UUID"),

  body("roles")
    .isArray()
    .withMessage("Roles must be an array")
    .notEmpty()
    .withMessage("At least one role must be provided"),

  handleValidationErrors,
];

/**
 * Validation rules for permission check
 */
export const validatePermissionCheck = [
  body("resource")
    .notEmpty()
    .withMessage("Resource is required")
    .isString()
    .withMessage("Resource must be a string"),

  body("action")
    .notEmpty()
    .withMessage("Action is required")
    .isString()
    .withMessage("Action must be a string"),

  handleValidationErrors,
];

/**
 * Validation rules for role check
 */
export const validateRoleCheck = [
  body("roleName").notEmpty().withMessage("Role name is required"),
  handleValidationErrors,
];
