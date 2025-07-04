import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import multer from 'multer';
import csrf from 'csurf';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import session from 'express-session';
import './config/passport.js';

import authRoutes from './routes/authRoutes.js';
import authOAuthRoutes from "./routes/authOAuthRoutes.js";
import userRoutes from './routes/userRoutes.js';
import postRoutes from './routes/postRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import imageAIRoutes from './routes/imageAIRoutes.js';
import errorHandler from './middlewares/errorMiddleware.js';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

app.use(passport.initialize());
app.use(passport.session());

const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

app.use((req, res, next) => {
    next();
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use('/api/auth', authRoutes);
app.use('/api/auth', authOAuthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/ai', imageAIRoutes);

app.use((req, res, next) => {
    if (!req.secure) {
        return res.redirect("https://" + req.headers.host + req.url);
    }
    next();
});

app.get('/api/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

app.get('/', (req, res) => {
    res.send('Server is running.');
});

app.use(errorHandler);

export default app;
