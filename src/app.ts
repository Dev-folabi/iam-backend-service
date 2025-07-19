import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { DataSource } from "typeorm";
import { config } from "./config";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";
import routes from "./routes/api";

export const createApp = (dataSource: DataSource): express.Application => {
  const app = express();

  // Initialize DataSource if not already initialized
  if (!dataSource.isInitialized) {
    dataSource.initialize().catch((err) =>
      console.error("App DataSource init failed:", err)
    );
  }

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: "*",
      credentials: true,
    })
  );

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
      error: "Too many requests from this IP, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api", limiter);

  // Body parsing middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use(requestLogger);

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({
      success: true,
      message: "healthy",
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      // Optionally add DataSource status
      databaseConnected: dataSource.isInitialized,
    });
  });

  // API routes
  app.use("/api/v1", routes);

  // 404 handler
  app.use("*", (req, res) => {
    res.status(404).json({
      success: false,
      error: "Route not found",
      message: `Cannot ${req.method} ${req.originalUrl}`,
    });
  });

  // Global error handler
  app.use(errorHandler);

  return app;
};