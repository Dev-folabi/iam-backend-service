import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/authService";
import { createError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { LoginDto, CreateUserDto } from "../types/interfaces";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Register a new user
   * POST /auth/register
   */
  register = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userData: CreateUserDto = req.body;

      const user = await this.authService.register(userData);

      logger.info(`User registration successful: ${user.username}`);

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: user,
      });
    } catch (error) {
      logger.error("User registration failed:", error);
      next(error);
    }
  };

  /**
   * Login user
   * POST /auth/login
   */
  login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const loginData: LoginDto = req.body;

      const authResponse = await this.authService.login(loginData);

      // Set refresh token as httpOnly cookie
      res.cookie("refreshToken", authResponse.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      logger.info(`User login successful: ${authResponse.user.username}`);

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          user: authResponse.user,
          accessToken: authResponse.accessToken,
        },
      });
    } catch (error) {
      logger.error("User login failed:", error);
      next(error);
    }
  };

  /**
   * Logout user
   * POST /auth/logout
   */
  logout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

      if (!refreshToken) {
        throw createError("Refresh token is required", 400);
      }

      await this.authService.logout(refreshToken);

      // Clear refresh token cookie
      res.clearCookie("refreshToken");

      logger.info("User logout successful");

      res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      logger.error("User logout failed:", error);
      next(error);
    }
  };

  /**
   * Refresh access token
   * POST /auth/refresh
   */
  refreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

      if (!refreshToken) {
        throw createError("Refresh token is required", 400);
      }

      const result = await this.authService.refreshAccessToken(refreshToken);

      logger.info("Token refresh successful");

      res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        data: result,
      });
    } catch (error) {
      logger.error("Token refresh failed:", error);
      next(error);
    }
  };

  /**
   * Get current user profile
   * GET /auth/profile
   */
  getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw createError("User not authenticated", 401);
      }

      const userProfile = await this.authService.getProfile(req.user.sub);

      res.status(200).json({
        success: true,
        message: "Profile retrieved successfully",
        data: userProfile,
      });
    } catch (error) {
      logger.error("Get profile failed:", error);
      next(error);
    }
  };

  /**
   * Check user permissions
   * POST /auth/check-permission
   */
  checkPermission = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw createError("User not authenticated", 401);
      }

      const { resource, action } = req.body;

      const hasPermission = await this.authService.hasPermission(
        req.user.sub,
        resource,
        action
      );

      res.status(200).json({
        success: true,
        message: "Permission check completed",
        data: {
          hasPermission,
          resource,
          action,
        },
      });
    } catch (error) {
      logger.error("Permission check failed:", error);
      next(error);
    }
  };

  /**
   * Check user role
   * POST /auth/check-role
   */
  checkRole = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw createError("User not authenticated", 401);
      }

      const { roleName } = req.body;

      const hasRole = await this.authService.hasRole(req.user.sub, roleName);

      res.status(200).json({
        success: true,
        message: "Role check completed",
        data: {
          hasRole,
          roleName,
        },
      });
    } catch (error) {
      logger.error("Role check failed:", error);
      next(error);
    }
  };

  /**
   * Revoke all refresh tokens for current user
   * POST /auth/revoke-all-tokens
   */
  revokeAllTokens = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw createError("User not authenticated", 401);
      }

      await this.authService.revokeAllRefreshTokens(req.user.sub);

      // Clear refresh token cookie
      res.clearCookie("refreshToken");

      logger.info(`All tokens revoked for user: ${req.user.username}`);

      res.status(200).json({
        success: true,
        message: "All refresh tokens revoked successfully",
      });
    } catch (error) {
      logger.error("Token revocation failed:", error);
      next(error);
    }
  };
}
