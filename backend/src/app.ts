import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

import authRoutes from './routes/auth.routes';
import transactionRoutes from './routes/transaction.routes';
import debtRoutes from './routes/debt.routes';
import userRoutes from './routes/user.routes';

// Routes
app.use('/auth', authRoutes);
app.use('/transactions', transactionRoutes);
app.use('/debts', debtRoutes);
app.use('/users', userRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'SpendScope API is running' });
});

export default app;
