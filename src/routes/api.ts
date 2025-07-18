import { Router } from "express";
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";

const router = Router();

/**
 * Mount route modules
 */
router.use("/auth", authRoutes);
router.use("/users", userRoutes);

/**
 * 404 handler for API routes
 */
router.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    path: req.originalUrl,
  });
});

export default router;
