import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import { 
  validateRegister,
  validateLogin,
  validateRefreshToken,
  validatePermissionCheck,
  handleValidationErrors,
  validateRoleCheck
} from '../middleware/validation';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';

const router = Router();
const authController = new AuthController();

// Rate limiting for auth endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictAuthRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Too many attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes (no authentication required)
router.post('/register', authRateLimit, validateRegister, authController.register);
router.post('/login', authRateLimit, validateLogin, authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', validateRefreshToken, authController.refreshToken);


// Protected routes (authentication required)
router.get('/profile', authMiddleware.authenticate, authController.getProfile);

// Permission and role checking
router.post('/check-permission',
  authMiddleware.authenticate,
  validatePermissionCheck,
  authController.checkPermission
);

router.post('/check-role',
  authMiddleware.authenticate,
  validateRoleCheck,
  authController.checkRole
);

// Token management
router.post('/revoke-all-tokens',
  strictAuthRateLimit,
  authMiddleware.authenticate,
  authController.revokeAllTokens
);

export default router;