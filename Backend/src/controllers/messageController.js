import Message from '../models/Message.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

export const sendMessage = async (req, res) => {
    try {
        const { receiverId, text } = req.body;
        console.log('receiverId:', receiverId, 'text:', text, 'user:', req.user);

        if (!receiverId || !text?.trim()) {
            return res.status(400).json({ message: 'Receiver and message text are required' });
        }
        if (!mongoose.Types.ObjectId.isValid(receiverId)) {
            console.error('Invalid receiverId:', receiverId);
            return res.status(400).json({ message: 'Invalid receiverId' });
        }
        const senderId = req.user.userId || req.user._id;
        if (!senderId) {
            console.error('No req.user or req.user._id/userId:', req.user);
            return res.status(401).json({ message: 'Unauthorized: user not found in request.' });
        }

        const message = new Message({
            sender: senderId,
            receiver: receiverId,
            text: text.trim()
        });

        await message.save();
        res.status(201).json({ message: 'Message sent', data: message });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ message: 'Failed to send message', error: error.message });
    }
};

export const getMessagesWithUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const myId = req.user.userId || req.user._id;

        const messages = await Message.find({
            $or: [
                { sender: myId, receiver: userId },
                { sender: userId, receiver: myId }
            ]
        }).sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
    }
};

export const getChats = async (req, res) => {
    try {
        const myId = req.user.userId || req.user._id;
        const messages = await Message.find({
            $or: [{ sender: myId }, { receiver: myId }]
        }).sort({ createdAt: -1 });

        const chatsMap = new Map();
        messages.forEach(msg => {
            const otherUserId = msg.sender.equals(myId) ? msg.receiver.toString() : msg.sender.toString();
            if (!chatsMap.has(otherUserId)) {
                chatsMap.set(otherUserId, {
                    userId: otherUserId,
                    lastMessage: msg,
                    unreadCount: 0
                });
            }
            if (msg.receiver.equals(myId) && !msg.isRead) {
                chatsMap.get(otherUserId).unreadCount += 1;
            }
        });

        const userIds = Array.from(chatsMap.keys());
        const users = await User.find({ _id: { $in: userIds } }).select('_id username avatarUrl');
        const usersMap = Object.fromEntries(users.map(u => [u._id.toString(), u]));

        const chats = Array.from(chatsMap.values()).map(chat => ({
            user: usersMap[chat.userId],
            lastMessage: chat.lastMessage,
            unreadCount: chat.unreadCount
        }));

        res.json(chats);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch chats', error: error.message });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const myId = req.user.userId || req.user._id;
        const { userId } = req.params;
        const result = await Message.updateMany(
            { sender: userId, receiver: myId, isRead: false },
            { $set: { isRead: true } }
        );
        res.json({ message: 'Messages marked as read', modifiedCount: result.modifiedCount });
    } catch (error) {
        res.status(500).json({ message: 'Failed to mark as read', error: error.message });
    }
};

export const searchUsers = async (req, res) => {
    try {
        const { username } = req.query;
        if (!username) return res.json([]);
        const users = await User.find({
            username: { $regex: '^' + username, $options: 'i' }
        }).select('_id username avatarUrl');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Failed to search users', error: error.message });
    }
};
