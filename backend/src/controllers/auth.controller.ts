import { Response } from 'express';
import { prisma } from '../app';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    currency: z.string().optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const register = async (req: AuthRequest, res: Response) => {
    try {
        const { email, password, currency } = registerSchema.parse(req.body);

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                preferences: { currency: currency || 'USD', theme: 'dark' },
            },
        });

        const token = jwt.sign({ id: user.id, email: user.email }, process.env['JWT_SECRET'] as string, {
            expiresIn: '7d',
        });

        res.status(201).json({ token, user: { id: user.id, email: user.email, preferences: user.preferences } });
    } catch (error) {
        res.status(400).json({ message: 'Invalid input', error });
    }
};

export const login = async (req: AuthRequest, res: Response) => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, process.env['JWT_SECRET'] as string, {
            expiresIn: '7d',
        });

        res.json({ token, user: { id: user.id, email: user.email, preferences: user.preferences } });
    } catch (error) {
        res.status(400).json({ message: 'Invalid input', error });
    }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        await prisma.user.delete({ where: { id: userId } });
        res.json({ message: 'Account and all data deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting account' });
    }
};
