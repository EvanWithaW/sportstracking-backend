import express, { Request, Response, NextFunction } from 'express';
import { AuthController } from '@controllers/authController';
import { authenticateUser } from '@middleware/authMiddleware';

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

// Middleware wrapper that allows both async functions and middleware
const wrapMiddleware = (middleware: Function) => 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // If middleware returns a promise, await it
      if (middleware.constructor.name === 'AsyncFunction') {
        await middleware(req, res, next);
      } else {
        // Otherwise, call it directly
        middleware(req, res, next);
      }
    } catch (error) {
      next(error);
    }
  };

// Authentication routes
router.post('/signup', errorHandler(authController.signup));
router.post('/login', errorHandler(authController.login));
router.post('/logout', errorHandler(authController.logout));

// Protected routes
router.get('/profile', 
  wrapMiddleware(authenticateUser), 
  errorHandler(authController.getProfile)
);
router.put('/profile', 
  wrapMiddleware(authenticateUser), 
  errorHandler(authController.updateProfile)
);

// Supabase authentication callback
router.get('/callback', errorHandler(authController.handleAuthCallback));

export default router;