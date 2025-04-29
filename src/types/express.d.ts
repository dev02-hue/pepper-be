import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      email: string;
      name: string;
      avatar: string;
      isAdmin: boolean;
      referralCode: string;
    };
  }
}
