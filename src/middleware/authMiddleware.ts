import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config, supabase } from '@config/config';

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  // Check for Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  // Extract token (expecting "Bearer TOKEN")
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Invalid token format' });
  }

  try {
    // Log token details for debugging
    console.log('Received Token:', token);
    console.log('JWT Secret:', config.JWT_SECRET);

    // First, verify the Supabase session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error('Supabase Session Verification Error:', sessionError);
      return res.status(401).json({ 
        message: 'Invalid session',
        error: sessionError?.message || 'No active session found'
      });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, config.JWT_SECRET, {
        algorithms: ['HS256']
      }) as { id: string, email: string };

      console.log('Decoded Token:', decoded);
    } catch (jwtError) {
      console.error('JWT Verification Error:', jwtError);
      return res.status(401).json({ 
        message: 'Invalid or expired token',
        error: jwtError instanceof Error ? jwtError.message : 'JWT verification failed'
      });
    }

    // Verify user exists in Supabase
    const { data: { user }, error } = await supabase.auth.getUser(session.access_token);

    if (error || !user) {
      console.error('Supabase User Verification Error:', error);
      return res.status(401).json({ 
        message: 'Invalid or expired token',
        error: error?.message || 'Supabase user verification failed'
      });
    }

    // Ensure the user ID matches the token
    if (user.id !== decoded.id) {
      return res.status(401).json({ 
        message: 'Token does not match user',
        error: 'User ID mismatch'
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication Middleware Error:', error);
    return res.status(401).json({ 
      message: 'Authentication failed', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
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