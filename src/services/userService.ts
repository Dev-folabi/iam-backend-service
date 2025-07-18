import { In, Repository } from "typeorm";
import { User } from "../entities/User";
import { Role } from "../entities/Role";
import { AppDataSource } from "../config/database";
import { PasswordUtils } from "../utils/password";
import { logger } from "../utils/logger";
import { createError } from "../middleware/errorHandler";
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponse,
  PaginationQuery,
  PaginatedResponse,
} from "../types/interfaces";
import { UserStatus } from "../types/enums";

export class UserService {
  private userRepository: Repository<User>;
  private roleRepository: Repository<Role>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.roleRepository = AppDataSource.getRepository(Role);
  }

  /**
   * Create a new user
   */
  async createUser(userData: CreateUserDto): Promise<UserResponse> {
    const {
      username,
      email,
      password,
      roles = [],
      status = UserStatus.ACTIVE,
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
      userRoles = await this.roleRepository.findBy({ id: In(roles) });
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

    logger.info(`User created successfully: ${savedUser.username}`);

    return this.mapUserToResponse(savedUser);
  }

  /**
   * Get all users with pagination
   */
  async getUsers(
    query: PaginationQuery
  ): Promise<PaginatedResponse<UserResponse>> {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = query;

    const offset = (page - 1) * limit;

    const [users, total] = await this.userRepository.findAndCount({
      relations: ["roles"],
      order: { [sortBy]: sortOrder },
      skip: offset,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: users.map((user) => this.mapUserToResponse(user)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<UserResponse> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ["roles"],
    });

    if (!user) {
      throw createError("User not found", 404);
    }

    return this.mapUserToResponse(user);
  }

  /**
   * Update user
   */
  async updateUser(
    id: string,
    updateData: UpdateUserDto
  ): Promise<UserResponse> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ["roles"],
    });

    if (!user) {
      throw createError("User not found", 404);
    }

    // Check if username or email already exists 
    if (updateData.username || updateData.email) {
      const existingUser = await this.userRepository.findOne({
        where: [{ username: updateData.username }, { email: updateData.email }],
      });

      if (existingUser && existingUser.id !== id) {
        throw createError("Username or email already exists", 409);
      }
    }

    // Update roles if provided
    if (updateData.roles) {
      const roles = await this.roleRepository.findBy({
        id: In(updateData.roles),
      });
      if (roles.length !== updateData.roles.length) {
        throw createError("One or more roles not found", 400);
      }
      user.roles = roles;
    }

    // Update other fields
    if (updateData.username) user.username = updateData.username;
    if (updateData.email) user.email = updateData.email;
    if (updateData.status) user.status = updateData.status;

    const updatedUser = await this.userRepository.save(user);

    logger.info(`User updated successfully: ${updatedUser.username}`);

    return this.mapUserToResponse(updatedUser);
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw createError("User not found", 404);
    }

    await this.userRepository.remove(user);

    logger.info(`User deleted successfully: ${user.username}`);
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
