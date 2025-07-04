import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import {
    getUserProfile,
    updateProfile,
    updateEmail,
    updatePassword,
    updateAvatar,
    deleteAvatar
} from '../controllers/userController.js';

const router = express.Router();

router.get('/me', authMiddleware, getUserProfile);
router.patch('/me/update-profile', authMiddleware, updateProfile);
router.patch('/me/update-email', authMiddleware, updateEmail);
router.patch('/me/update-password', authMiddleware, updatePassword);
router.post('/me/update-avatar', authMiddleware, updateAvatar);
router.delete('/me/delete-avatar', authMiddleware, deleteAvatar);

export default router;
