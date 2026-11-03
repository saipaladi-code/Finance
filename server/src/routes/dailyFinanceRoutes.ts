import { Router } from 'express';
import {
  getDailyAccounts,
  createDailyAccount,
  getDailyAccountById,
  recordDailyPayment,
} from '../controllers/dailyFinanceController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getDailyAccounts);
router.post('/', createDailyAccount);
router.get('/:id', getDailyAccountById);
router.post('/:id/payments', recordDailyPayment);

export default router;
