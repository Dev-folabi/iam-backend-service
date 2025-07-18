import { In, Repository } from "typeorm";
import { User } from "../entities/User";
import { Role } from "../entities/Role";
import { RefreshToken } from "../entities/RefreshToken";
import { AppDataSource } from "../config/database";
import { PasswordUtils } from "../utils/password";
import { JwtUtils } from "../utils/jwt";
import { logger } from "../utils/logger";
import { createError } from "../middleware/errorHandler";
import {
  LoginDto,
  AuthResponse,
  UserResponse,
  CreateUserDto,
} from "../types/interfaces";
import { UserStatus } from "../types/enums";
import crypto from "crypto";

export class AuthService {
  private userRepository: Repository<User>;
  private roleRepository: Repository<Role>;
  private refreshTokenRepository: Repository<RefreshToken>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.roleRepository = AppDataSource.getRepository(Role);
    this.refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
  }

  /**
   * Register a new user
   */
  async register(userData: CreateUserDto): Promise<UserResponse> {
    const {
      username,
      email,
      password,
      roles = [],
      status = UserStatus.PENDING,
    } = userData;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ username }, { email }],
    });

    if (existingUser) {
      throw createError("Username or email already exists", 409);
    }

    // Validate password strength
    const passwordValidation = PasswordUtils.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw createError(
        `Password validation failed: ${passwordValidation.errors.join(", ")}`,
        400
      );
    }

    // Hash password
    const passwordHash = await PasswordUtils.hashPassword(password);

    // Get roles if provided
    let userRoles: Role[] = [];
    if (roles.length > 0) {
      userRoles = await this.roleRepository.findBy({
        id: In(roles),
      });

      if (userRoles.length !== roles.length) {
        throw createError("One or more roles not found", 400);
      }
    }

    // Create user
    const user = this.userRepository.create({
      username,
      email,
      passwordHash,
      status,
      roles: userRoles,
    });

    const savedUser = await this.userRepository.save(user);

    logger.info(`User registered successfully: ${savedUser.username}`);

    return this.mapUserToResponse(savedUser);
  }

  /**
   * Login user and return tokens
   */
  async login(loginData: LoginDto): Promise<AuthResponse> {
    const { username, password } = loginData;

    // Find user with roles and permissions
    const user = await this.userRepository.findOne({
      where: { username },
      relations: ["roles", "roles.permissions"],
    });

    if (!user) {
      throw createError("Invalid credentials", 401);
    }

    // Check user status
    if (user.status === UserStatus.SUSPENDED) {
      throw createError("Account is suspended", 403);
    }

    if (user.status === UserStatus.INACTIVE) {
      throw createError("Account is inactive", 403);
    }

    // Verify password
    const isPasswordValid = await PasswordUtils.comparePassword(
      password,
      user.passwordHash
    );
    if (!isPasswordValid) {
      throw createError("Invalid credentials", 401);
    }

    // Extract roles and permissions
    const roles = user.roles.map((role) => role.name);
    const permissions = user.roles.flatMap((role) =>
      role.permissions.map(
        (permission) => `${permission.resource}:${permission.action}`
      )
    );

    // Generate tokens
    const accessToken = JwtUtils.generateAccessToken({
      sub: user.id,
      username: user.username,
      email: user.email,
      roles,
      permissions,
    });

    const refreshToken = JwtUtils.generateRefreshToken({
      sub: user.id,
      username: user.username,
    });

    // Store refresh token
    await this.storeRefreshToken(user.id, refreshToken);

    // Update last login
    user.lastLogin = new Date();
    await this.userRepository.save(user);

    logger.info(`User logged in successfully: ${user.username}`);

    return {
      user: this.mapUserToResponse(user),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Logout user (revoke refresh token)
   */
  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);

    const storedToken = await this.refreshTokenRepository.findOne({
      where: { tokenHash },
    });

    if (storedToken) {
      storedToken.isRevoked = true;
      await this.refreshTokenRepository.save(storedToken);
      logger.info(`User logged out successfully: ${storedToken.userId}`);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(
    refreshToken: string
  ): Promise<{ accessToken: string }> {
    try {
      // Verify refresh token
      const decoded = JwtUtils.verifyRefreshToken(refreshToken);

      // Check if refresh token exists and is not revoked
      const tokenHash = this.hashToken(refreshToken);
      const storedToken = await this.refreshTokenRepository.findOne({
        where: { tokenHash, isRevoked: false },
        relations: ["user", "user.roles", "user.roles.permissions"],
      });

      if (!storedToken) {
        throw createError("Invalid refresh token", 401);
      }

      // Check if token is expired
      if (storedToken.expiresAt < new Date()) {
        throw createError("Refresh token expired", 401);
      }

      const user = storedToken.user;

      // Check user status
      if (
        user.status === UserStatus.SUSPENDED ||
        user.status === UserStatus.INACTIVE
      ) {
        throw createError("Account is not active", 403);
      }

      // Extract roles and permissions
      const roles = user.roles.map((role) => role.name);
      const permissions = user.roles.flatMap((role) =>
        role.permissions.map(
          (permission) => `${permission.resource}:${permission.action}`
        )
      );

      // Generate new access token
      const accessToken = JwtUtils.generateAccessToken({
        sub: user.id,
        username: user.username,
        email: user.email,
        roles,
        permissions,
      });

      logger.info(`Access token refreshed for user: ${user.username}`);

      return { accessToken };
    } catch (error) {
      logger.error("Failed to refresh access token:", error);
      throw createError("Invalid refresh token", 401);
    }
  }

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<UserResponse> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["roles"],
    });

    if (!user) {
      throw createError("User not found", 404);
    }

    return this.mapUserToResponse(user);
  }

  /**
   * Verify user has required permissions
   */
  async hasPermission(
    userId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["roles", "roles.permissions"],
    });

    if (!user) {
      return false;
    }

    const hasPermission = user.roles.some((role) =>
      role.permissions.some(
        (permission) =>
          permission.resource === resource && permission.action === action
      )
    );

    return hasPermission;
  }

  /**
   * Verify user has required role
   */
  async hasRole(userId: string, roleName: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["roles"],
    });

    if (!user) {
      return false;
    }

    return user.roles.some((role) => role.name === roleName);
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true }
    );

    logger.info(`All refresh tokens revoked for user: ${userId}`);
  }

  /**
   * Clean up expired refresh tokens
   */
  async cleanupExpiredTokens(): Promise<void> {
    const expiredTokens = await this.refreshTokenRepository.find({
      where: {
        expiresAt: require("typeorm").LessThan(new Date()),
      },
    });

    if (expiredTokens.length > 0) {
      await this.refreshTokenRepository.remove(expiredTokens);
      logger.info(`Cleaned up ${expiredTokens.length} expired refresh tokens`);
    }
  }

  /**
   * Store refresh token in database
   */
  private async storeRefreshToken(
    userId: string,
    refreshToken: string
  ): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Remove old refresh tokens for this user
    await this.refreshTokenRepository.delete({
      userId,
      isRevoked: false,
    });

    const refreshTokenEntity = this.refreshTokenRepository.create({
      userId,
      tokenHash,
      expiresAt,
    });

    await this.refreshTokenRepository.save(refreshTokenEntity);
  }

  /**
   * Hash token for secure storage
   */
  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Map User entity to UserResponse
   */
  private mapUserToResponse(user: User): UserResponse {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      status: user.status,
      roles: user.roles?.map((role) => role.name) || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
    };
  }
}
