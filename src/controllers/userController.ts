import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/userService";
import { logger } from "../utils/logger";
import {
  CreateUserDto,
  UpdateUserDto,
  PaginationQuery,
} from "../types/interfaces";

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Create a new user
   * POST /users
   */
  createUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userData: CreateUserDto = req.body;

      const user = await this.userService.createUser(userData);

      logger.info(`User created successfully: ${user.username}`);

      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: user,
      });
    } catch (error) {
      logger.error("User creation failed:", error);
      next(error);
    }
  };

  /**
   * Get all users with pagination
   * GET /users
   */
  getUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const query: PaginationQuery = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        sortBy: (req.query.sortBy as string) || "createdAt",
        sortOrder: (req.query.sortOrder as "ASC" | "DESC") || "DESC",
      };

      const result = await this.userService.getUsers(query);

      res.status(200).json({
        success: true,
        message: "Users retrieved successfully",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error("Get users failed:", error);
      next(error);
    }
  };

  /**
   * Get user by ID
   * GET /users/:id
   */
  getUserById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      const user = await this.userService.getUserById(id);

      res.status(200).json({
        success: true,
        message: "User retrieved successfully",
        data: user,
      });
    } catch (error) {
      logger.error("Get user by ID failed:", error);
      next(error);
    }
  };

  /**
   * Update user
   * PUT /users/:id
   */
  updateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: UpdateUserDto = req.body;

      const user = await this.userService.updateUser(id, updateData);

      logger.info(`User updated successfully: ${user.username}`);

      res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: user,
      });
    } catch (error) {
      logger.error("User update failed:", error);
      next(error);
    }
  };

  /**
   * Delete user
   * DELETE /users/:id
   */
  deleteUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      await this.userService.deleteUser(id);

      logger.info(`User deleted successfully with ID: ${id}`);

      res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      logger.error("User deletion failed:", error);
      next(error);
    }
  };
}
