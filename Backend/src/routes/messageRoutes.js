import express from 'express';
import { sendMessage, getMessagesWithUser, getChats, markAsRead, searchUsers } from '../controllers/messageController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/chats', authMiddleware, getChats);
router.patch('/:userId/read', authMiddleware, markAsRead);
router.get('/search-users', authMiddleware, searchUsers);
router.post('/', authMiddleware, sendMessage);
router.get('/:userId', authMiddleware, getMessagesWithUser);

export default router;
