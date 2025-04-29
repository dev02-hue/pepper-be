import { Router } from 'express';
import passport from '../config/passport';
import { AuthController } from '../controllers/auth.controller';

const router = Router();

// Initiate Google OAuth
router.get('/google', (req, res, next) => {
  const referralCode = req.query.referralCode as string | undefined;
  const state = referralCode || undefined;
  
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account',
    failWithError: true,
    state: state
  })(req, res, next);
});

// Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/login',
    session: true
  }),
  (req, res, next) => {
    AuthController.googleCallback(req, res).catch(next);
  }
);

// Get current user
router.get('/me', (req, res, next) => {
  AuthController.getCurrentUser(req, res).catch(next);
});

// Logout
router.post('/logout', AuthController.logout);

export default router;