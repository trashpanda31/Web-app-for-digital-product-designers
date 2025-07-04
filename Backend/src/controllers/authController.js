import bcrypt from "bcrypt";
import User from "../models/User.js";
import { sendMail } from "../utils/mailer.js";
import { log, logSecurity } from "../utils/logger.js";
import { generateAccessToken, generateRefreshToken } from "../services/authService.js";

export const register = async (req, res, next) => {
  try {
    const { username, email, password, confirmPassword, firstName, lastName } = req.body;

    if (!firstName || !lastName || !username || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!/^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long and contain at least one letter and one number"
      });
    }

    const existingUser = await User.findOne({ 
      $or: [
        { email },
        { username }
      ]
    });
    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email 
          ? "User with this email already exists" 
          : "Username is already taken" 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      avatar: ""
    });

    await user.save();
    log(`New user registered: ${email}`, req.ip);

    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();
    log(`New user registered: ${email}`, req.ip);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    await sendMail(
      email,
      "Welcome to ST79687 Web APP for digital product designers!",
      `<p>Hello, ${firstName}!</p>
       <p>Thank you for registering on <strong>ST79687 Web APP for digital product designers</strong>.</p>
       <p>We're excited to have you on board. Happy designing!</p>`
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      userId: user._id
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!email) return res.status(400).json({ success: false, message: "Email is required" });
    if (!password) return res.status(400).json({ success: false, message: "Password is required" });
    if (!confirmPassword) return res.status(400).json({ success: false, message: "Confirm Password is required" });

    if (!/^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      logSecurity(`Failed login attempt: non-existent email ${email}`, req.ip);
      return res.status(400).json({ success: false, message: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logSecurity(`Failed login attempt: incorrect password for ${email}`, req);
      return res.status(400).json({ success: false, message: "Incorrect password" });
    }

    if (password !== confirmPassword) {
      logSecurity(`Failed login attempt: password mismatch for ${email}`, req.ip);
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    log(`User logged in: ${email}`, req);
    res.status(200).json({ success: true, message: "Login successful", accessToken });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token, access denied" });
    }

    const user = await User.findOne({ refreshToken });
    if (!user) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = generateAccessToken(user._id);
    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.sendStatus(204);

    const user = await User.findOne({ refreshToken });
    if (!user) return res.sendStatus(204);

    user.refreshToken = null;
    await user.save();

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production"
    });

    log(`User logged out: ${user.email}`, req.ip);
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};
