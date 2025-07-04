import bcrypt from 'bcrypt';
import User from '../models/User.js';
import multer from 'multer';
import { s3, getFileURL } from '../config/s3.js';
import { v4 as uuidv4 } from 'uuid';
import { sendMail } from '../utils/mailer.js';

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password -refreshToken');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, username } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.username = username || user.username;

    await user.save();
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateEmail = async (req, res) => {
  try {
    const { newEmail } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!/^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/.test(newEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!user.isOAuth) {
      const { currentPassword, confirmPassword } = req.body;
      
      if (!currentPassword || !confirmPassword) {
        return res.status(400).json({ message: 'Current password is required' });
      }

      if (currentPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect password' });
      }
    }

    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      return res.status(400).json({ message: 'This email is already in use' });
    }

    const oldEmail = user.email;
    user.email = newEmail;
    await user.save();

    await sendMail(
      oldEmail,
      'Email Change Notification - ST79687 Web APP',
      `<div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #1a73e8;">Email Change Notification</h2>
        <p>The email address associated with your account on <strong>ST79687 Web APP for digital product designers</strong> has been changed.</p>
        <p>Your email has been changed from <strong>${oldEmail}</strong> to <strong>${newEmail}</strong>.</p>
        <p>If you did not make this change, please contact us immediately at <a href="mailto:support@st79687webapp.com" style="color: #1a73e8;">support@st79687webapp.com</a> to secure your account.</p>
        <p style="margin-top: 30px; font-size: 12px; color: #666;">This is an automated message, please do not reply to this email.</p>
      </div>`
    );

    res.json({ message: 'Email updated successfully' });
  } catch (error) {
    console.error('Error updating email:', error);
    res.status(500).json({ message: 'Server error while updating email' });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    const passwordPattern = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordPattern.test(newPassword)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters long, contain at least one uppercase letter and one digit.'
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    await sendMail(
      user.email,
      'Password Change Notification - ST79687 Web APP',
      `<div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #1a73e8;">Password Change Notification</h2>
        <p>The password for your account on <strong>ST79687 Web APP for digital product designers</strong> has been changed.</p>
        <p>If you did not make this change, please contact us immediately at <a href="mailto:support@st79687webapp.com" style="color: #1a73e8;">support@st79687webapp.com</a> to secure your account.</p>
        <p style="margin-top: 30px; font-size: 12px; color: #666;">This is an automated message, please do not reply to this email.</p>
      </div>`
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const storage = multer.memoryStorage();
const upload = multer({ storage });

export const updateAvatar = [
  upload.single('avatar'),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      if (user.avatarUrl) {
        const oldKey = user.avatarUrl.split('/').slice(-2).join('/');
        await s3.deleteObject({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: oldKey
        }).promise();
      }

      const fileKey = `avatars/${uuidv4()}-${req.file.originalname}`;
      await s3.upload({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: fileKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      }).promise();

      user.avatarUrl = getFileURL(fileKey);
      await user.save();

      res.json({
        message: 'Avatar updated successfully',
        avatarUrl: user.avatarUrl
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to upload avatar', error: error.message });
    }
  }
];

export const deleteAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.avatarUrl) {
      const oldKey = user.avatarUrl.split('/').slice(-2).join('/');
      await s3.deleteObject({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: oldKey
      }).promise();

      user.avatarUrl = null;
      await user.save();

      res.json({
        message: 'Avatar deleted successfully',
        avatarUrl: null
      });
    } else {
      res.status(400).json({ message: 'No avatar to delete' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete avatar', error: error.message });
  }
};


