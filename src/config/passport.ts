import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { User } from '../models/user.model';
import dotenv from 'dotenv';

dotenv.config();

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: "https://pepper-be.onrender.com/auth/google/callback", 
    scope: ['profile', 'email'],
    passReqToCallback: true,
    proxy: true
  },
  async (req, accessToken, refreshToken, profile: Profile, done) => {
    try {
      const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
      const email = profile.emails?.[0].value || '';
      const referralCode = req.query.state as string | undefined;

      // Find or create user
      let user = await User.findOne({ googleId: profile.id });

      if (!user) {
        // New user creation
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: email,
          avatar: profile.photos?.[0].value,
          balance: 50,
          isAdmin: adminEmails.includes(email)
        });

        // Handle referral if exists
        if (referralCode) {
          const referrer = await User.findOne({ referralCode });
          if (referrer) {
            user.referredBy = referrer._id;
            await user.save();
            
            // Add referral bonus to referrer
            referrer.balance += Number(process.env.REFERRAL_BONUS) || 65;
            await referrer.save();
          }
        }
      } else {
        // Update existing user
        user.isAdmin = adminEmails.includes(email);
        await user.save();
      }

      return done(null, user);
    } catch (err) {
      return done(err as Error);
    }
  }
));

// Serialization
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialization
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;