import { Router } from 'express';
import {
  getPayments,
  getPaymentById,
  reversePayment,
} from '../controllers/paymentController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getPayments);
router.get('/:id', getPaymentById);
router.post('/:id/reverse', requireAdmin, reversePayment);

export default router;

