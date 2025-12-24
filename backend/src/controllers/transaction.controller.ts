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

const updateTransactionSchema = z.object({
    amount: z.number().optional(),
    merchant: z.string().optional(),
    category: z.string().optional(),
    date: z.string().optional(),
    note: z.string().optional(),
    type: z.enum(['income', 'expense']).optional(),
});

export const updateTransaction = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const transaction = await prisma.transaction.findUnique({ where: { id: id ?? '' } });
        if (!transaction || transaction.userId !== userId) {
            return res.status(404).json({ message: 'Transaction not found or unauthorized' });
        }

        const parsed = updateTransactionSchema.parse(req.body);

        // Build update data, filtering undefined values
        const data: { amount?: number; merchant?: string; category?: string; date?: Date; note?: string; type?: string } = {};
        if (parsed.amount !== undefined) data.amount = parsed.amount;
        if (parsed.merchant !== undefined) data.merchant = parsed.merchant;
        if (parsed.category !== undefined) data.category = parsed.category;
        if (parsed.date !== undefined) data.date = new Date(parsed.date);
        if (parsed.note !== undefined) data.note = parsed.note;
        if (parsed.type !== undefined) data.type = parsed.type;

        const updatedTransaction = await prisma.transaction.update({
            where: { id: id ?? '' },
            data,
        });

        res.json(updatedTransaction);
    } catch (error) {
        res.status(400).json({ message: 'Invalid input', error });
    }
};
