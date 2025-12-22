import { Response } from 'express';
import { prisma } from '../app';
import { AuthRequest } from '../middleware/auth.middleware';
import { z } from 'zod';

const transactionSchema = z.object({
    amount: z.number(),
    merchant: z.string(),
    category: z.string(),
    date: z.string().optional(), // ISO date string
    note: z.string().optional(),
    type: z.enum(['income', 'expense']).optional(),
    isAutoCaptured: z.boolean().optional(),
});

export const getTransactions = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const transactions = await prisma.transaction.findMany({
            where: { userId },
            orderBy: { date: 'desc' },
        });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching transactions', error });
    }
};

export const addTransaction = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const data = transactionSchema.parse(req.body);

        const transaction = await prisma.transaction.create({
            data: {
                userId,
                amount: data.amount,
                merchant: data.merchant,
                category: data.category,
                date: data.date ? new Date(data.date) : new Date(),
                note: data.note ?? null,
                type: data.type || 'expense',
                isAutoCaptured: data.isAutoCaptured || false,
            },
        });

        res.status(201).json(transaction);
    } catch (error) {
        res.status(400).json({ message: 'Invalid input', error });
    }
};

export const deleteTransaction = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        // Verify ownership
        const transaction = await prisma.transaction.findUnique({ where: { id: id ?? '' } });
        if (!transaction || transaction.userId !== userId) {
            return res.status(404).json({ message: 'Transaction not found or unauthorized' });
        }

        await prisma.transaction.delete({ where: { id: id ?? '' } });
        res.json({ message: 'Transaction deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting transaction' });
    }
};
