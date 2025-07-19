import { DataSource } from "typeorm";
import { config } from "./index";
import { logger } from "../utils/logger";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: config.db.host,
  port: config.db.port,
  username: config.db.username,
  password: config.db.password,
  database: config.db.name,
  synchronize: false,
  logging: config.nodeEnv === "development",
  entities: [__dirname + "/../entities/*.{ts,js}"],
  migrations: [__dirname + "/migrations/*{.ts,.js}"],
  subscribers: [__dirname + "/subscribers/*{.ts,.js}"],
  ssl: config.db.useSSL ? { rejectUnauthorized: true } : false,
});

// export const AppDataSource = new DataSource({
//   type: "sqlite",
//   database: config.db.name,
//   synchronize: false,
//   logging: config.nodeEnv === "development",
//   entities: [__dirname + "/../entities/*.{ts,js}"],
//   migrations: [__dirname + "/migrations/*{.ts,.js}"],
//   subscribers: [__dirname + "/subscribers/*{.ts,.js}"],
// });
export const initializeDatabase = async (): Promise<void> => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info("Database connection established successfully");
    }
  } catch (error) {
    logger.error("Database connection failed:", error);
    process.exit(1);
  }
};

export default AppDataSource;
