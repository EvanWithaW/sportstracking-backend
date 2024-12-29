import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@config/config';

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Invalid token format' });
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, config.JWT_SECRET, {
      algorithms: ['HS256']
    }) as { id: string, email: string };

    console.log('Decoded Token:', decoded);
    console.log('Decoded ID:', decoded.id);

    // Attach user info from token to request object
    req.user = decoded;
    next();
  } catch (jwtError) {
    console.error('JWT Verification Error:', jwtError);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}