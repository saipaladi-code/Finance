import { Router } from 'express';
import {
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
} from '../controllers/reportsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/daily', getDailyReport);
router.get('/weekly', getWeeklyReport);
router.get('/monthly', getMonthlyReport);

export default router;

