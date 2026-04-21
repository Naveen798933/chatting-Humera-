import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { protect } from '../middleware/authMiddleware.js';
import { requirePrivateRoom } from '../middleware/roomMiddleware.js';
import { deleteMessage, editMessage, getRoom, sendMessage, togglePinMessage, updateProfile, updateRoomSettings } from '../controllers/roomController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const upload = multer({ dest: path.join(__dirname, '..', '..', 'uploads') });
const router = Router();

router.get('/:roomId', protect, requirePrivateRoom, getRoom);
router.put('/:roomId/settings', protect, requirePrivateRoom, updateRoomSettings);
router.put('/profile/me', protect, upload.single('avatar'), updateProfile);
router.post('/:roomId/messages', protect, requirePrivateRoom, sendMessage);
router.put('/:roomId/pins/:messageId', protect, requirePrivateRoom, togglePinMessage);
router.put('/messages/:messageId', protect, editMessage);
router.delete('/messages/:messageId', protect, deleteMessage);

export default router;