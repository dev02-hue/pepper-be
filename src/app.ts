import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
dotenv.config();
 import sessionConfig from './config/session';
import passport from './config/passport';
import authRoutes from './routes/auth.routes';
// import userRoutes from './routes/user.routes';
import connectDB from './config/connectDB';
import errorMiddleware from './middlewares/errorMiddleware';

connectDB();


const app: Application = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(sessionConfig);
app.use(passport.initialize());
app.use(passport.session());

 

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));


// Routes
app.use('/auth', authRoutes);
// app.use('/api/user', userRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.use(errorMiddleware.notFound);
app.use(errorMiddleware.errorHandler);

export default app;