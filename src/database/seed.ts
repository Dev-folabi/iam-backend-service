import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { Role } from "../entities/Role";
import { Permission } from "../entities/Permission";
import { UserStatus } from "../types/enums";
import bcrypt from "bcrypt";
import { logger } from "../utils/logger";

interface SeedData {
  roles: Array<{
    name: string;
    description: string;
    permissions: string[];
  }>;
  permissions: Array<{
    name: string;
    resource: string;
    action: string;
    description: string;
  }>;
  users: Array<{
    username: string;
    email: string;
    password: string;
    status: UserStatus;
    roles: string[];
  }>;
}

const seedData: SeedData = {
  permissions: [
    {
      name: "users:read",
      resource: "users",
      action: "read",
      description: "View user information",
    },
    {
      name: "users:write",
      resource: "users",
      action: "write",
      description: "Create and update users",
    },
    {
      name: "users:delete",
      resource: "users",
      action: "delete",
      description: "Delete users",
    },
    {
      name: "roles:read",
      resource: "roles",
      action: "read",
      description: "View roles",
    },
    {
      name: "roles:write",
      resource: "roles",
      action: "write",
      description: "Create and update roles",
    },
    {
      name: "roles:delete",
      resource: "roles",
      action: "delete",
      description: "Delete roles",
    },
    {
      name: "permissions:read",
      resource: "permissions",
      action: "read",
      description: "View permissions",
    },
    {
      name: "permissions:write",
      resource: "permissions",
      action: "write",
      description: "Create and update permissions",
    },
    {
      name: "permissions:delete",
      resource: "permissions",
      action: "delete",
      description: "Delete permissions",
    },
    {
      name: "system:admin",
      resource: "system",
      action: "admin",
      description: "Full system administration",
    },
    {
      name: "posts:read",
      resource: "posts",
      action: "read",
      description: "View posts",
    },
    {
      name: "posts:write",
      resource: "posts",
      action: "write",
      description: "Create and update posts",
    },
    {
      name: "posts:delete",
      resource: "posts",
      action: "delete",
      description: "Delete posts",
    },
    {
      name: "posts:moderate",
      resource: "posts",
      action: "moderate",
      description: "Moderate posts",
    },
  ],
  roles: [
    {
      name: "admin",
      description: "Full system administrator access",
      permissions: [
        "users:read",
        "users:write",
        "users:delete",
        "roles:read",
        "roles:write",
        "roles:delete",
        "permissions:read",
        "permissions:write",
        "permissions:delete",
        "system:admin",
        "posts:read",
        "posts:write",
        "posts:delete",
        "posts:moderate",
      ],
    },
    {
      name: "moderator",
      description: "Moderation capabilities",
      permissions: [
        "users:read",
        "users:write",
        "roles:read",
        "posts:read",
        "posts:write",
        "posts:moderate",
      ],
    },
    {
      name: "user",
      description: "Standard user access",
      permissions: ["users:read", "posts:read", "posts:write"],
    },
    {
      name: "guest",
      description: "Limited guest access",
      permissions: ["posts:read"],
    },
  ],
  users: [
    {
      username: "admin",
      email: "admin@example.com",
      password: "Admin123!",
      status: UserStatus.ACTIVE,
      roles: ["admin"],
    },
    {
      username: "moderator",
      email: "moderator@example.com",
      password: "Moderator123!",
      status: UserStatus.ACTIVE,
      roles: ["moderator"],
    },
    {
      username: "testuser",
      email: "testuser@example.com",
      password: "TestUser123!",
      status: UserStatus.ACTIVE,
      roles: ["user"],
    },
    {
      username: "johndoe",
      email: "john.doe@example.com",
      password: "JohnDoe123!",
      status: UserStatus.ACTIVE,
      roles: ["user"],
    },
    {
      username: "janedoe",
      email: "jane.doe@example.com",
      password: "JaneDoe123!",
      status: UserStatus.PENDING,
      roles: ["user"],
    },
    {
      username: "suspended_user",
      email: "suspended@example.com",
      password: "Suspended123!",
      status: UserStatus.SUSPENDED,
      roles: ["user"],
    },
  ],
};

const seedDatabase = async (): Promise<void> => {
  try {
    logger.info("Starting database seeding...");

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Get repositories
    const userRepo = AppDataSource.getRepository(User);
    const roleRepo = AppDataSource.getRepository(Role);
    const permissionRepo = AppDataSource.getRepository(Permission);

    // Start transaction
    await AppDataSource.transaction(async (manager) => {
      logger.info("Seeding permissions...");

      // Seed permissions
      const permissionsMap = new Map<string, Permission>();
      for (const permData of seedData.permissions) {
        let permission = await manager.findOne(Permission, {
          where: { name: permData.name },
        });

        if (!permission) {
          permission = manager.create(Permission, {
            name: permData.name,
            resource: permData.resource,
            action: permData.action,
            description: permData.description,
          });
          await manager.save(permission);
          logger.info(`Created permission: ${permData.name}`);
        } else {
          logger.info(`Permission already exists: ${permData.name}`);
        }

        permissionsMap.set(permData.name, permission);
      }

      logger.info("Seeding roles...");

      // Seed roles
      const rolesMap = new Map<string, Role>();
      for (const roleData of seedData.roles) {
        let role = await manager.findOne(Role, {
          where: { name: roleData.name },
          relations: ["permissions"],
        });

        if (!role) {
          role = manager.create(Role, {
            name: roleData.name,
            description: roleData.description,
            permissions: [],
          });
        } else {
          logger.info(`Role already exists: ${roleData.name}`);
        }

        // Assign permissions to role
        const rolePermissions: Permission[] = [];
        for (const permissionName of roleData.permissions) {
          const permission = permissionsMap.get(permissionName);
          if (permission) {
            rolePermissions.push(permission);
          }
        }

        role.permissions = rolePermissions;
        await manager.save(role);

        if (!rolesMap.has(roleData.name)) {
          logger.info(
            `Created role: ${roleData.name} with ${rolePermissions.length} permissions`
          );
        } else {
          logger.info(
            `Updated role: ${roleData.name} with ${rolePermissions.length} permissions`
          );
        }

        rolesMap.set(roleData.name, role);
      }

      logger.info("Seeding users...");

      // Seed users
      for (const userData of seedData.users) {
        let user = await manager.findOne(User, {
          where: [{ username: userData.username }, { email: userData.email }],
          relations: ["roles"],
        });

        if (!user) {
          // Hash password
          const saltRounds = 12;
          const hashedPassword = await bcrypt.hash(
            userData.password,
            saltRounds
          );

          // Get user roles
          const userRoles: Role[] = [];
          for (const roleName of userData.roles) {
            const role = rolesMap.get(roleName);
            if (role) {
              userRoles.push(role);
            }
          }

          user = manager.create(User, {
            username: userData.username,
            email: userData.email,
            passwordHash: hashedPassword,
            status: userData.status,
            roles: userRoles,
          });

          await manager.save(user);
          logger.info(
            `Created user: ${userData.username} (${
              userData.email
            }) with roles: ${userData.roles.join(", ")}`
          );
        } else {
          logger.info(
            `User already exists: ${userData.username} (${userData.email})`
          );
        }
      }
    });

    logger.info("Database seeding completed successfully!");

    // Print summary
    const userCount = await userRepo.count();
    const roleCount = await roleRepo.count();
    const permissionCount = await permissionRepo.count();

    logger.info("Database Summary:");
    logger.info(`Users: ${userCount}`);
    logger.info(`Roles: ${roleCount}`);
    logger.info(`Permissions: ${permissionCount}`);
  } catch (error) {
    console.error("Database seeding failed:", error);
    throw error;
  }
};

const clearDatabase = async (): Promise<void> => {
  try {
    logger.info("Clearing database...");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Get repositories
    const userRepo = AppDataSource.getRepository(User);
    const roleRepo = AppDataSource.getRepository(Role);
    const permissionRepo = AppDataSource.getRepository(Permission);

    // Clear in reverse order due to foreign key constraints
    await userRepo.delete({});
    await roleRepo.delete({});
    await permissionRepo.delete({});

    logger.info("Database cleared successfully");
  } catch (error) {
    console.error("Database clearing failed:", error);
    throw error;
  }
};

const reseedDatabase = async (): Promise<void> => {
  try {
    logger.info("Reseeding database...");
    await clearDatabase();
    await seedDatabase();
    logger.info("Database reseeded successfully!");
  } catch (error) {
    console.error("Database reseeding failed:", error);
    throw error;
  }
};

// CLI interface
const runSeeding = async (): Promise<void> => {
  try {
    const command = process.argv[2];

    switch (command) {
      case "clear":
        await clearDatabase();
        break;
      case "reseed":
        await reseedDatabase();
        break;
      case "seed":
      default:
        await seedDatabase();
        break;
    }
  } catch (error) {
    console.error("Seeding operation failed:", error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
};

// Run if called directly
if (require.main === module) {
  runSeeding();
}

export { seedDatabase, clearDatabase, reseedDatabase };
