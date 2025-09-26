import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import classroomRouter from './routes/classroom';
import webhookRouter from './routes/webhooks';
import { pollAndSync } from './poller';

dotenv.config();

const app = express();
app.use(express.json());

const mongoUrl = process.env.MONGO_URL || 'mongodb://mongo:27017/semillero';
mongoose.connect(mongoUrl).then(() => console.log('Classroom-service connected to mongo'));

app.use('/api/classroom', classroomRouter);
app.use('/api/webhooks', webhookRouter);

// Start poller (runs every 5 minutes)
setInterval(() => {
  pollAndSync();
}, 5 * 60 * 1000);

const port = process.env.CLASSROOM_SERVICE_PORT || 4000;
app.listen(port, () => console.log(`Classroom service running on port ${port}`));


