import { Router } from 'express';
import { UserController } from '@controllers/userController';
import { authenticateUser } from '@middleware/authMiddleware';
import { wrapMiddleware } from '../utils/wrapMiddleware';

const router = Router();
const userController = new UserController();

// Profile routes
router.get('/profile', wrapMiddleware(authenticateUser), (req, res, next) => {
  userController.getProfile(req, res, next);
});

router.put('/profile', wrapMiddleware(authenticateUser), (req, res, next) => {
  userController.updateProfile(req, res, next);
});

export default router;
