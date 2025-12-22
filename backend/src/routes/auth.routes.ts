import { Router } from 'express';
import { login, register, deleteAccount } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.delete('/me', authenticateToken, deleteAccount);

export default router;
