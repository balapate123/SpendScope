import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/me', getProfile);
router.patch('/me', updateProfile);

export default router;
