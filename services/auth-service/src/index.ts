
import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'], credentials: true }));

const mongoUrl = process.env.MONGO_URL || 'mongodb://mongo:27017/semillero';
mongoose.connect(mongoUrl).then(() => console.log('Auth-service connected to mongo'));

app.use('/api/auth', authRouter);

const port = process.env.AUTH_SERVICE_PORT || 4000;
app.listen(port, () => console.log(`Auth service running on port ${port}`));


