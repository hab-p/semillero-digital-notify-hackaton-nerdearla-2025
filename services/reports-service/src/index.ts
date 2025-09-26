import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import reportsRouter from './routes/reports';

dotenv.config();

const app = express();
app.use(express.json());

const mongoUrl = process.env.MONGO_URL || 'mongodb://mongo:27017/semillero';
mongoose.connect(mongoUrl).then(() => console.log('Reports-service connected to mongo'));

app.use('/api/reports', reportsRouter);

const port = process.env.REPORTS_SERVICE_PORT || 4000;
app.listen(port, () => console.log(`Reports service running on port ${port}`));


