import { Router } from 'express';
import { getDebts, addDebt, deleteDebt } from '../controllers/debt.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getDebts);
router.post('/', addDebt);
router.delete('/:id', deleteDebt);

export default router;
