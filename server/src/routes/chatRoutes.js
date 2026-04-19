import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requirePrivateRoom } from '../middleware/roomMiddleware.js';

const router = Router();

router.post('/presence', protect, requirePrivateRoom, (req, res) => {
  res.json({ message: 'Presence acknowledged' });
});

export default router;