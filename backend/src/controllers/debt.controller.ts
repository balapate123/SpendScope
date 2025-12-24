import { Response } from 'express';
import { prisma } from '../app';
import { AuthRequest } from '../middleware/auth.middleware';
import { z } from 'zod';

const debtSchema = z.object({
    name: z.string(),
    principal: z.number(),
    rate: z.number(),
    minPayment: z.number(),
});

export const getDebts = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const debts = await prisma.debt.findMany({ where: { userId } });
        res.json(debts);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching debts' });
    }
};

export const addDebt = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const data = debtSchema.parse(req.body);

        const debt = await prisma.debt.create({
            data: {
                userId,
                ...data,
            },
        });

        res.status(201).json(debt);
    } catch (error) {
        res.status(400).json({ message: 'Invalid input', error });
    }
};

export const deleteDebt = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        const debt = await prisma.debt.findUnique({ where: { id: id ?? '' } });
        if (!debt || debt.userId !== userId) {
            return res.status(404).json({ message: 'Debt not found or unauthorized' });
        }

        await prisma.debt.delete({ where: { id: id ?? '' } });
        res.json({ message: 'Debt deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting debt' });
    }
};

const updateDebtSchema = z.object({
    name: z.string().optional(),
    principal: z.number().optional(),
    rate: z.number().optional(),
    minPayment: z.number().optional(),
});

export const updateDebt = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const debt = await prisma.debt.findUnique({ where: { id: id ?? '' } });
        if (!debt || debt.userId !== userId) {
            return res.status(404).json({ message: 'Debt not found or unauthorized' });
        }

        const parsed = updateDebtSchema.parse(req.body);

        // Filter out undefined values for Prisma
        const data: { name?: string; principal?: number; rate?: number; minPayment?: number } = {};
        if (parsed.name !== undefined) data.name = parsed.name;
        if (parsed.principal !== undefined) data.principal = parsed.principal;
        if (parsed.rate !== undefined) data.rate = parsed.rate;
        if (parsed.minPayment !== undefined) data.minPayment = parsed.minPayment;

        const updatedDebt = await prisma.debt.update({
            where: { id: id ?? '' },
            data,
        });

        res.json(updatedDebt);
    } catch (error) {
        res.status(400).json({ message: 'Invalid input', error });
    }
};
