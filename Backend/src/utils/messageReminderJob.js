import Message from '../models/Message.js';
import User from '../models/User.js';
import { sendMail } from './mailer.js';

export const checkUnreadMessages = async () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

    const messages = await Message.find({
        isRead: false,
        notified: false,
        createdAt: { $lte: threeHoursAgo }
    });

    for (const msg of messages) {
        const recipient = await User.findById(msg.receiver);
        const sender = await User.findById(msg.sender);

        if (recipient?.email && sender) {
            const senderName = `${sender.firstName} ${sender.lastName}`.trim();

            await sendMail(
                recipient.email,
                'You have an unread message!',
                `<p><strong>${senderName}</strong> sent you a message on <strong>ST79687 Web APP for digital product designers</strong>:</p>
         <blockquote>${msg.text}</blockquote>
         <p>But you haven’t read it yet. Don’t miss it!</p>`
            );

            msg.notified = true;
            await msg.save();
        }
    }
};
