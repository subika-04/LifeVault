import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']); 
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import vaultRoutes from './routes/vaultRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import reminderRoutes from './routes/reminderRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import errorHandler from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Look for .env in the root folder first, then backend folder, then fallback to current working directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 7000;

connectDB();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'https://lifevault-wheat.vercel.app',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'LifeVault API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
