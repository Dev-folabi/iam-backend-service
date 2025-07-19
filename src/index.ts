import { createApp } from "./app";
import AppDataSource, { initializeDatabase } from "./config/database";
import { config } from "./config";
import { logger } from "./utils/logger";

const startServer = async (): Promise<void> => {
  try {
    // Initialize database connection
    await initializeDatabase();

    // Create Express app
    const app = createApp(AppDataSource);

    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Health check: http://localhost:${config.port}/health`);
    });

    server.setTimeout(30000);

    // Graceful shutdown
    let isShuttingDown = false;
    const gracefulShutdown = async () => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      logger.info("Shutdown signal received. Cleaning up...");

      try {
        await AppDataSource.destroy();
        logger.info("Database connection closed.");
      } catch (err) {
        logger.error("Error closing database connection:", err);
      }

      server.close(() => {
        logger.info("HTTP server closed.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();
