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
      const { email, password, username, first_name, last_name }: UserRegistration = req.body;

      // Validate input
      if (!email || !password || !username) {
        return res.status(400).json({ message: 'Email, password, and username are required' });
      }

      // Signup with Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });

      if (authError) {
        return res.status(400).json({ message: 'Signup failed', error: authError.message });
      }

      console.log('Inserting into user_profiles:', {
        user_id: authData.user?.id || '',
        username,
        first_name,
        last_name,
        email: authData.user?.email || '',
        favorite_teams: [],
        profile_pic_url: ''
      });

      if (!authData.user) {
        console.error('User not found after signup:', authData);
        return res.status(401).json({ message: 'User not found or error fetching user' });
      }

      // Insert into user_profiles
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: authData.user.id || '',
          username,
          first_name,
          last_name,
          email: authData.user.email || '',
          favorite_teams: [],
          profile_pic_url: ''
        });

      console.log('Profile insert response:', profileData, profileError);

      if (profileError) {
        return res.status(500).json({ message: 'Profile creation failed', error: profileError.message });
      }

      // Generate JWT token
      const tokenPayload = {
        id: authData.user.id,
        email: authData.user.email || ''
      };

      const token = AuthController.generateToken(tokenPayload);

      res.status(201).json({
        message: 'Signup successful',
        user: {
          id: authData.user.id,
          email: authData.user.email || ''
        },
        token,
        refresh_token: authData.session?.refresh_token
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

      const token = AuthController.generateToken(tokenPayload);

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

  // Refresh token method
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required' });
      }

      // Verify the refresh token
      const decoded = jwt.verify(refreshToken, config.JWT_SECRET, {
        algorithms: ['HS256']
      }) as { id: string, email: string };

      // Generate a new access token
      const newAccessToken = AuthController.generateToken({
        id: decoded.id,
        email: decoded.email
      });

      res.status(200).json({
        accessToken: newAccessToken
      });
    } catch (error) {
      console.error('Refresh Token Error:', error);
      return res.status(401).json({ 
        message: 'Invalid or expired refresh token',
        error: error instanceof Error ? error.message : 'Token verification failed'
      });
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

      const token = AuthController.generateToken(tokenPayload);

      // Redirect to frontend with token
      res.redirect(`http://localhost:${config.PORT}/dashboard?token=${token}&refresh_token=${data.session?.refresh_token}`);
    } catch (error: any) {
      next(error);
    }
  }
}