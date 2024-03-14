import { NextFunction, Request, Response } from 'express';

import { Container } from 'typedi';
import { Profile } from '@/interfaces/profiles.interface';
import { ProfileService } from '@/services/profiles.service';

export class ProfleController {
  public profile = Container.get(ProfileService);

  public createProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profileData: Profile = req.body;
      const createProfileData: Profile = await this.profile.createProfile(profileData);

      res.status(201).json({ data: createProfileData, message: 'created' });
    } catch (error) {
      next(error);
    }
  };
}
