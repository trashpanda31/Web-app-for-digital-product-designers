import express from 'express';
import passport from 'passport';
import { urls } from '../config/urls.js';

const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: urls.client.login }),
    (req, res) => {
        res.redirect(`${urls.client.dashboard}?accessToken=${req.user.accessToken}&refreshToken=${req.user.refreshToken}`);
    }
);

router.get('/gitlab', passport.authenticate('gitlab', { scope: ['read_user'] }));
router.get('/gitlab/callback',
    passport.authenticate('gitlab', { failureRedirect: urls.client.login }),
    (req, res) => {
        res.redirect(`${urls.client.dashboard}?accessToken=${req.user.accessToken}&refreshToken=${req.user.refreshToken}`);
    }
);

export default router;
