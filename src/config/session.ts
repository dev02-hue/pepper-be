import session from 'express-session';
import dotenv from 'dotenv';

dotenv.config();

// Validate session secret exists
const sessionSecret = process.env.SESSION_SECRET || 'generate-a-strong-secret-here';
if (!process.env.SESSION_SECRET) {
  console.warn('⚠️  Using fallback session secret - For production, set SESSION_SECRET in .env');
} else {
  console.log('🔑 Session secret loaded from environment variables');
}

const MemoryStore = session.MemoryStore;
const store = new MemoryStore();

const sessionConfig = session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: store,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
});

// Add session event listeners for debugging
store.on('create', (sessionId) => {
  console.log(`🆕 New session created: ${sessionId}`);
});

store.on('destroy', (sessionId) => {
  console.log(`🗑️  Session destroyed: ${sessionId}`);
});

console.log('✅ Session middleware configured with:');
console.log({
  secureCookies: process.env.NODE_ENV === 'production',
  httpOnly: true,
  maxAge: '24h'
});

export default sessionConfig;