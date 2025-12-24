import { Router } from 'express';
import { getTransactions, addTransaction, deleteTransaction, updateTransaction } from '../controllers/transaction.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken); // Protect all routes

router.get('/', getTransactions);
router.post('/', addTransaction);
router.patch('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
