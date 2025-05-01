import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import { ValidationError } from 'class-validator';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { User } from '../models/user.model';
import { IUser } from '../models/user.model';
import { hashPassword, comparePassword } from '../utils/hash';
import { Types } from 'mongoose';

export const AuthController = {
   googleCallback: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUser;

    if (!user) {
      res.status(401).json({ message: 'Authentication failed' });
      return;
    }

    console.log(`✅ User authenticated: ${user.name} (${user.isAdmin ? 'Admin' : 'User'})`);

    if (user.isAdmin) {
      res.redirect('/joker/dashboard');
    } else {
      res.redirect('/user/dashboard');
    }
  }),

  // ✅ Get current user (from session)
  getCurrentUser: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const user = req.user as IUser;
    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      isAdmin: user.isAdmin,
      balance: user.balance,
      referralCode: user.referralCode
    });
  }),

  // ✅ Logout
  logout: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Logged out successfully' });
      });
    });
  }),

  // ✅ Register
  register: asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password, referralCode } = req.body;
  
    if (!name || !email || !password) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }
  
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }
  
    const hashedPassword = await hashPassword(password);
    const referralBonus = Number(process.env.REFERRAL_BONUS) || 65;
  
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      balance: 50,
    });
  
    // Referral logic
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        // Type-safe assignment
        newUser.referredBy = referrer._id as Types.ObjectId;
        
        // Add referral bonus to referrer's balance
        referrer.balance += referralBonus;
        
        // Add the new user to referrer's referrals array
        referrer.referrals.push(newUser._id as Types.ObjectId);
        
        await referrer.save();
      }
    }
  
    await newUser.save();
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser._id.toString(),  
        name: newUser.name,
        email: newUser.email,
        balance: newUser.balance,
        referredBy: newUser.referredBy?.toString() || null, 
        referralCode: newUser.referralCode
      }
    });
  }),

 

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
  
    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }
  
    const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    if (!user) {
      // For security, don't reveal whether email exists
      res.status(200).json({ 
        message: 'If an account exists, a reset email has been sent',
        // Return a dummy token in case email doesn't exist
        token: 'dummy_token_12345' 
      });
      return;
    }
  
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000);
  
    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;
    await user.save();
  
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  
    const mailOptions = {
      to: user.email,
      from: `"Your App Name" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      subject: 'Password Reset Request',
      html: `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          padding: 20px 0;
        }
        .logo {
          max-width: 150px;
        }
        .content {
          background-color: #f9f9f9;
          padding: 30px;
          border-radius: 8px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #4CAF50;
          color: white !important;
          text-decoration: none;
          border-radius: 4px;
          font-weight: bold;
          margin: 20px 0;
        }
        .footer {
          margin-top: 30px;
          font-size: 12px;
          color: #777;
          text-align: center;
        }
        .code {
          background-color: #f0f0f0;
          padding: 10px;
          border-radius: 4px;
          font-family: monospace;
          word-break: break-all;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <!-- Replace with your logo -->
        <img src="https://yourwebsite.com/logo.png" alt="Your App Logo" class="logo">
      </div>
      
      <div class="content">
        <h2>Password Reset Request</h2>
        <p>Hello ${user.name},</p>
        
        <p>We received a request to reset your password. Click the button below to proceed:</p>
        
        <p style="text-align: center;">
          <a href="${resetLink}" class="button">Reset Password</a>
        </p>
        
        <p>This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.</p>
        
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p class="code">${resetLink}</p>
      </div>
      
      <div class="footer">
        <p>© ${new Date().getFullYear()} Your App Name. All rights reserved.</p>
        <p>If you have any questions, contact us at support@yourapp.com</p>
      </div>
    </body>
    </html>`  
    };
  
    try {
      await transporter.sendMail(mailOptions);
      res.status(200).json({ 
        message: 'A reset email has been sent',
        token: token, // Return the actual token
        expiresAt: expires.toISOString() // Optional: include expiration time
      });
    } catch (error) {
      console.error('Email send error:', error);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      res.status(500).json({ 
        message: 'Error sending reset email',
        token: null 
      });
    }
  }),


  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ message: 'Token is invalid or has expired' });
      return;
    }

    const hashed = await hashPassword(newPassword);
    user.password = hashed;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  }),

  // ✅ Login
  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user || !user.password) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        referralCode: user.referralCode,
        balance: user.balance
      }
    });
  }),
};