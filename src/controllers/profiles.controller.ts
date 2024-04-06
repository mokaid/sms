import { NextFunction, Request, Response } from 'express';

import { Container } from 'typedi';
import { HttpException } from '@/exceptions/HttpException';
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

  public getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const orderBy = (req.query.orderBy as string) || 'createdAt';
      const sort = (req.query.sort as string) || 'asc';

      const { profiles, totalProfiles } = await this.profile.findAllProfile(page, limit, orderBy, sort);

      res.status(200).json({ data: profiles, total: totalProfiles, page, limit, message: 'findAll' });
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
