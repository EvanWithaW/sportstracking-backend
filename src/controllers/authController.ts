import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config, supabase } from '@config/config';
import { LoginCredentials, UserRegistration } from '@models/auth';

export class AuthController {
  // Static method for generating token with more robust options
  static generateToken(user: { id: string; email: string }) {
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email 
      }, 
      config.JWT_SECRET, 
      { 
        expiresIn: '7d',
        algorithm: 'HS256'  // Explicitly specify the algorithm
      }
    );
  }

  // Signup method
  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const { 
        email, 
        password, 
        username, 
        first_name, 
        last_name 
      }: UserRegistration = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Signup with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            first_name,
            last_name,
            favorite_teams: []
          }
        }
      });

      if (error) {
        return res.status(400).json({ 
          message: 'Signup failed', 
          error: error.message 
        });
      }

      // Ensure user exists
      if (!data.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Generate JWT token
      const tokenPayload = {
        id: data.user.id,
        email: data.user.email || ''
      };

      console.log('Signup Token Payload:', tokenPayload);

      const token = AuthController.generateToken(tokenPayload);

      console.log('Generated Signup Token:', token);

      res.status(201).json({
        message: 'Signup successful',
        user: {
          id: data.user.id,
          email: data.user.email || ''
        },
        token,
        refresh_token: data.session?.refresh_token
      });
    } catch (error) {
      next(error);
    }
  }

  // Login method
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password }: LoginCredentials = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Login with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return res.status(401).json({ 
          message: 'Login failed', 
          error: error.message 
        });
      }

      // Ensure user exists
      if (!data.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Generate JWT token
      const tokenPayload = {
        id: data.user.id,
        email: data.user.email || ''
      };

      console.log('Login Token Payload:', tokenPayload);

      const token = AuthController.generateToken(tokenPayload);

      console.log('Generated Login Token:', token);

      res.status(200).json({
        message: 'Login successful',
        user: {
          id: data.user.id,
          email: data.user.email || ''
        },
        token,
        refresh_token: data.session?.refresh_token
      });
    } catch (error) {
      next(error);
    }
  }

  // Logout method
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // Logout from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        return res.status(400).json({ 
          message: 'Logout failed', 
          error: error.message 
        });
      }

      res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
      next(error);
    }
  }

  // Get user profile
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      // User is already attached to req by authenticateUser middleware
      const user = req.user;

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          ...user.user_metadata
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user profile
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { 
        username, 
        first_name, 
        last_name, 
        favorite_teams 
      } = req.body;

      // Validate favorite teams (optional)
      if (favorite_teams) {
        if (!Array.isArray(favorite_teams)) {
          return res.status(400).json({ 
            message: 'Favorite teams must be an array' 
          });
        }

        if (favorite_teams.length > 5) {
          return res.status(400).json({ 
            message: 'Maximum 5 favorite teams allowed' 
          });
        }

        const invalidTeams = favorite_teams.filter(team => 
          typeof team !== 'string' || team.trim().length === 0
        );

        if (invalidTeams.length > 0) {
          return res.status(400).json({ 
            message: 'Invalid team names provided' 
          });
        }
      }

      // Update user metadata
      const { data, error } = await supabase.auth.updateUser({
        data: {
          username: username || req.user.user_metadata.username,
          first_name: first_name || req.user.user_metadata.first_name,
          last_name: last_name || req.user.user_metadata.last_name,
          favorite_teams: favorite_teams || req.user.user_metadata.favorite_teams
        }
      });

      if (error) {
        return res.status(500).json({ 
          message: 'Profile update failed', 
          error: error.message 
        });
      }

      res.status(200).json({ 
        message: 'Profile updated successfully',
        user: {
          id: req.user.id,
          email: req.user.email,
          ...data.user?.user_metadata
        }
      });
    } catch (error: any) {
      next(error);
    }
  }

  // Supabase authentication callback
  async handleAuthCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.query;

      if (!code) {
        return res.status(400).json({ message: 'No authorization code provided' });
      }

      // Exchange code for session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code as string);

      if (error) {
        return res.status(400).json({ 
          message: 'Authentication callback failed', 
          error: error.message 
        });
      }

      // Ensure user exists
      if (!data.user) {
        return res.status(400).json({ 
          message: 'User information not available' 
        });
      }

      // Generate JWT token
      const tokenPayload = {
        id: data.user.id,
        email: data.user.email || ''
      };

      console.log('Callback Token Payload:', tokenPayload);

      const token = AuthController.generateToken(tokenPayload);

      console.log('Generated Callback Token:', token);

      // Redirect to frontend with token
      res.redirect(`http://localhost:${config.PORT}/dashboard?token=${token}&refresh_token=${data.session?.refresh_token}`);
    } catch (error: any) {
      next(error);
    }
  }
}