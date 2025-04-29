import { User } from '../models/user.model';

// Function to generate random referral code
function generateReferralCode(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let referralCode = '';
  for (let i = 0; i < length; i++) {
    referralCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return referralCode;
}

export class AuthService {
  static async findOrCreateGoogleUser(profile: any) {
    console.log('findOrCreateGoogleUser called with profile:', profile);

    // First, try to find by email
    let user = await User.findOne({ email: profile.email });
    console.log('User found in database:', user);

    if (!user) {
      console.log('User not found, creating a new one...');
      
      const referralCode = generateReferralCode(); // generate referral code
      
      user = new User({
        googleId: profile.id,
        name: profile.name,
        email: profile.email,
        avatar: profile.avatar,
        referralCode, // save referral code
        balance: 50,  // welcome bonus $50
        isAdmin: false // default normal user
      });

      await user.save();
      console.log('New user saved:', user);
    } else {
      console.log('Existing user returned:', user);

      // Update googleId if missing (maybe user registered before without Google)
      if (!user.googleId) {
        user.googleId = profile.id;
        await user.save();
        console.log('GoogleId added to existing user');
      }
    }

    return user;
  }
}
