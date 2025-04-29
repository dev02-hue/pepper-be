import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/user.model';

export class AuthController {
  static async googleCallback(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      
      if (!user) {
        return res.status(401).json({ message: 'Authentication failed' });
      }

      console.log(`✅ User authenticated: ${user.name} (${user.isAdmin ? 'Admin' : 'User'})`);

      // Redirect based on user role
      if (user.isAdmin) {
        return res.redirect('/admin-dashboard');
      } else {
        return res.redirect('/dashboard');
      }
    } catch (error) {
      console.error('Error in googleCallback:', error);
      return res.redirect('/login?error=auth_failed');
    }
  }

  static async getCurrentUser(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const user = req.user as IUser;
      return res.status(200).json({
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isAdmin: user.isAdmin,
        balance: user.balance,
        referralCode: user.referralCode
      });
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static logout(req: Request, res: Response, next: NextFunction) {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie('connect.sid');
        return res.status(200).json({ message: 'Logged out successfully' });
      });
    });
  }
}