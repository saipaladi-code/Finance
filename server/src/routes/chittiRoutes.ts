import { Router } from 'express';
import {
  getChitGroups,
  createChitGroup,
  getChitGroupById,
  addChitMember,
  conductAuction,
  recordChitPayment,
} from '../controllers/chittiController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/groups', getChitGroups);
router.post('/groups', createChitGroup);
router.get('/groups/:id', getChitGroupById);
router.post('/groups/:id/members', addChitMember);
router.post('/groups/:id/auctions', conductAuction);
router.post('/groups/:id/payments', recordChitPayment);

export default router;
