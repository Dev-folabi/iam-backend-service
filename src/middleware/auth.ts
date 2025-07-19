import { Request, Response, NextFunction } from "express";
import { JwtUtils } from "../utils/jwt";
import { AuthService } from "../services/authService";
import { createError } from "./errorHandler";
import { logger } from "../utils/logger";
import { JwtPayload } from "../types/interfaces";
import AppDataSource from "../config/database";

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export class AuthMiddleware {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService(AppDataSource);
  }

  /**
   * Middleware to authenticate JWT token
   */
  authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const token = JwtUtils.extractTokenFromHeader(authHeader);

      if (!token) {
        throw createError("Access token is required", 401);
      }

      // Verify token
      const decoded = JwtUtils.verifyAccessToken(token);

      // Attach user to request
      req.user = decoded;

      next();
    } catch (error) {
      logger.error("Authentication failed:", error);
      next(createError("Invalid or expired token", 401));
    }
  };

  /**
   * Middleware to check if user has required role
   */
  requireRole = (requiredRole: string) => {
    return async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        if (!req.user) {
          throw createError("User not authenticated", 401);
        }

        const hasRole = req.user.roles.includes(requiredRole);

        if (!hasRole) {
          throw createError(
            `Access denied. Required role: ${requiredRole}`,
            403
          );
        }

        next();
      } catch (error) {
        logger.error("Role check failed:", error);
        next(error);
      }
    };
  };

  /**
   * Middleware to check if user has any of the required roles
   */
  requireAnyRole = (requiredRoles: string[]) => {
    return async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        if (!req.user) {
          throw createError("User not authenticated", 401);
        }

        const hasAnyRole = requiredRoles.some((role) =>
          req.user!.roles.includes(role)
        );

        if (!hasAnyRole) {
          throw createError(
            `Access denied. Required roles: ${requiredRoles.join(", ")}`,
            403
          );
        }

        next();
      } catch (error) {
        logger.error("Role check failed:", error);
        next(error);
      }
    };
  };

  /**
   * Middleware to check if user has required permission
   */
  requirePermission = (resource: string, action: string) => {
    return async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        if (!req.user) {
          throw createError("User not authenticated", 401);
        }

        const requiredPermission = `${resource}:${action}`;
        const hasPermission = req.user.permissions.includes(requiredPermission);

        if (!hasPermission) {
          throw createError(
            `Access denied. Required permission: ${requiredPermission}`,
            403
          );
        }

        next();
      } catch (error) {
        logger.error("Permission check failed:", error);
        next(error);
      }
    };
  };

  /**
   * Middleware to check if user has any of the required permissions
   */
  requireAnyPermission = (
    permissions: Array<{ resource: string; action: string }>
  ) => {
    return async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        if (!req.user) {
          throw createError("User not authenticated", 401);
        }

        const hasAnyPermission = permissions.some(({ resource, action }) => {
          const requiredPermission = `${resource}:${action}`;
          return req.user!.permissions.includes(requiredPermission);
        });

        if (!hasAnyPermission) {
          const permissionStrings = permissions.map(
            (p) => `${p.resource}:${p.action}`
          );
          throw createError(
            `Access denied. Required permissions: ${permissionStrings.join(
              ", "
            )}`,
            403
          );
        }

        next();
      } catch (error) {
        logger.error("Permission check failed:", error);
        next(error);
      }
    };
  };

  /**
   * Middleware to check if user can access their own resource or is admin
   */
  requireOwnershipOrAdmin = (userIdParam: string = "id") => {
    return async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        if (!req.user) {
          throw createError("User not authenticated", 401);
        }

        const targetUserId = req.params[userIdParam];
        const currentUserId = req.user.sub;
        const isAdmin = req.user.roles.includes("admin");

        if (currentUserId !== targetUserId && !isAdmin) {
          throw createError(
            "Access denied. You can only access your own resources or must be admin",
            403
          );
        }

        next();
      } catch (error) {
        logger.error("Ownership check failed:", error);
        next(error);
      }
    };
  };
}

export const authMiddleware = new AuthMiddleware();
