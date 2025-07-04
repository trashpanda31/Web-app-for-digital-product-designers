import express from 'express';
import csrf from 'csurf';
import { register, login, logout, refreshToken } from '../controllers/authController.js';
import { log } from '../utils/logger.js';
import { loginLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();
const csrfProtection = csrf({ cookie: true });

router.post('/register', csrfProtection, register);
router.post('/login', csrfProtection, loginLimiter, login);
router.post('/refresh', csrfProtection, refreshToken);
router.post('/logout', csrfProtection, logout);

export default router;
