import { Router } from 'express';
import {
  getPayments,
  createPayment,
  updatePaymentStatus,
  deletePayment,
} from '../controllers/payments.controller';
import { authenticate, requireSuperAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate, requireSuperAdmin);

router.get('/', getPayments);
router.post('/', createPayment);
router.put('/:id', updatePaymentStatus);
router.delete('/:id', deletePayment);

export default router;

