import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  verifyOtpAndResetPassword,
  resetPassword,
  changePassword,
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticateToken, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/request-otp', forgotPassword); // Alias for clarity
router.post('/verify-otp-reset', verifyOtpAndResetPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', authenticateToken, changePassword);

export default router;
