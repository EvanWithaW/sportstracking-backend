import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Sports Tracking API is running!' });
});

app.use('/auth', authRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Sports Tracking API is running on port ${PORT}`);
});