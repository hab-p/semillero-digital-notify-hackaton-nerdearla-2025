
import express from 'express';
import dotenv from 'dotenv';
import notificationsRouter from './routes/notifications';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
app.use(express.json());

const mongoUrl = process.env.MONGO_URL || 'mongodb://mongo:27017/semillero';
mongoose.connect(mongoUrl).then(() => console.log('Notifications-service connected to mongo'));

app.use('/api/notifications', notificationsRouter);

const port = process.env.NOTIFICATIONS_SERVICE_PORT || 4000;
app.listen(port, () => console.log(`Notifications service running on port ${port}`));


