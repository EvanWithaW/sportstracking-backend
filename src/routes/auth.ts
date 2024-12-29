import express, { Request, Response, NextFunction } from 'express';
import { AuthController } from '@controllers/authController';
import { authenticateUser } from '@middleware/authMiddleware';
import { wrapMiddleware } from '../utils/wrapMiddleware';

const router = express.Router();
const authController = new AuthController();

// More flexible error handling middleware
const errorHandler = (fn: Function) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ 
        message: 'Internal server error', 
        error: error.message 
      });
    } else {
      res.status(500).json({ 
        message: 'Unknown error occurred' 
      });
    }
  }
};

// Authentication routes
router.post('/signup', errorHandler(authController.signup));
router.post('/login', errorHandler(authController.login));
router.post('/logout', errorHandler(authController.logout));
router.post('/refresh-token', errorHandler(authController.refreshToken));

// Supabase authentication callback
router.get('/callback', errorHandler(authController.handleAuthCallback));

export default router;