import { Router } from 'express';
import passport from '../config/passport';
import { AuthController } from '../controllers/auth.controller';

const router = Router();

// Google OAuth routes
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

router.get(
  '/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/login',
    session: true
  }),
  AuthController.googleCallback
);

// Auth routes
router.get('/me', AuthController.getCurrentUser);
router.post('/logout', AuthController.logout);
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password/:token', AuthController.resetPassword);

export default router;