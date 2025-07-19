import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Role } from "./entities/Role";
import { Permission } from "./entities/Permission";
import { RefreshToken } from "./entities/RefreshToken";

export const TestDataSource = new DataSource({
  type: "sqlite",
  database: ":memory:",
  dropSchema: true,
  entities: [User, Role, Permission, RefreshToken],
  synchronize: true,
  logging: false,
});
