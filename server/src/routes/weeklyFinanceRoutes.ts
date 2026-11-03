import { Router } from 'express';
import {
  getWeeklyAccounts,
  createWeeklyAccount,
  getWeeklyAccountById,
  recordWeeklyPayment,
} from '../controllers/weeklyFinanceController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getWeeklyAccounts);
router.post('/', createWeeklyAccount);
router.get('/:id', getWeeklyAccountById);
router.post('/:id/payments', recordWeeklyPayment);

export default router;

