import { Router } from 'express';
import { forgotPassword, login, logout, me, resendVerificationOtp, resetPassword, signup, verifyOtpRoute } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/signup', signup);
router.post('/verify-otp', verifyOtpRoute);
router.post('/resend-otp', resendVerificationOtp);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, me);
router.post('/logout', logout);

export default router;