import { Response } from 'express';
import { prisma } from '../app';
import { AuthRequest } from '../middleware/auth.middleware';
import { z } from 'zod';

const updateProfileSchema = z.object({
    netWorth: z.number().optional(),
    monthlyIncome: z.number().optional(),
    preferences: z.any().optional(),
});

export const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                preferences: true,
                netWorth: true,
                monthlyIncome: true,
                createdAt: true,
            },
        });

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const data = updateProfileSchema.parse(req.body);

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(data.netWorth !== undefined && { netWorth: data.netWorth }),
                ...(data.monthlyIncome !== undefined && { monthlyIncome: data.monthlyIncome }),
                ...(data.preferences !== undefined && { preferences: data.preferences }),
            },
            select: {
                id: true,
                email: true,
                preferences: true,
                netWorth: true,
                monthlyIncome: true,
            },
        });

        res.json(user);
    } catch (error) {
        res.status(400).json({ message: 'Invalid input', error });
    }
};
