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

  public getProifle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const findAllProfilesData: Profile[] = await this.profile.findAllProfile();

      res.status(200).json({ data: findAllProfilesData, message: 'findAll' });
    } catch (error) {
      next(error);
    }
  };

  public getPofileById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profileId: string = req.params.id;
      const findOneProfileData: Profile = await this.profile.findProfileById(profileId);

      res.status(200).json({ data: findOneProfileData, message: 'findOne' });
    } catch (error) {
      next(error);
    }
  };

  public updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profileId: string = req.params.id;
      const profileData: Profile = req.body;

      const updateProfileData: Profile = await this.profile.updateProfile(profileId, profileData);

      res.status(200).json({ data: updateProfileData, message: 'updated' });
    } catch (error) {
      next(error);
    }
  };

  public deleteProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profileId: string = req.params.id;
      const deleteProfileData: Profile = await this.profile.deleteProfile(profileId);

      res.status(200).json({ data: deleteProfileData, message: 'deleted' });
    } catch (error) {
      next(error);
    }
  };
}
