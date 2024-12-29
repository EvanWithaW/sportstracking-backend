import { Request, Response, NextFunction } from 'express';
import { supabase } from '@config/config';

export class UserController {
  // Get user profile
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;

      if (!user) {
        console.error('User not found in request:', req);
        return res.status(404).json({ message: 'User not found' });
      }

      console.log('User Object:', user);

      const userId = user.id;

      // Fetch user profile from the database
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, favorite_teams')
        .eq('user_id', userId)
        .single();

      if (profileError || !profileData) {
        console.error('Error fetching user profile:', profileError);
        return res.status(500).json({ message: 'Error fetching user profile' });
      }

      res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          favorite_teams: profileData.favorite_teams || []
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

      // Update user profile
      const userId = req.user.id;
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          first_name: first_name,
          last_name: last_name,
          favorite_teams: favorite_teams
        })
        .eq('user_id', userId);

      if (error) {
        return res.status(500).json({ 
          message: 'Profile update failed', 
          error: error.message 
        });
      }

      // Fetch updated user profile from the database
      const { data: updatedProfileData, error: updatedProfileError } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, favorite_teams')
        .eq('user_id', userId)
        .single();

      if (updatedProfileError || !updatedProfileData) {
        console.error('Error fetching updated user profile:', updatedProfileError);
        return res.status(500).json({ message: 'Error fetching updated user profile' });
      }

      res.status(200).json({ 
        message: 'Profile updated successfully',
        user: {
          id: req.user.id,
          email: req.user.email,
          first_name: updatedProfileData.first_name || '',
          last_name: updatedProfileData.last_name || '',
          favorite_teams: updatedProfileData.favorite_teams || []
        }
      });
    } catch (error: any) {
      next(error);
    }
  }
}
