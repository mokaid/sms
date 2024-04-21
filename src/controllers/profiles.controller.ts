import { NextFunction, Request, Response } from 'express';

import { Container } from 'typedi';
import { ProfileService } from '@/services/profiles.service';

export class ProfleController {
  public profile = Container.get(ProfileService);

  public createProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profileData = req.body;

      const createProfileData = await this.profile.createProfile(profileData);

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
      const searchTerm = (req.query.searchTerm as string) || '';

      const { profiles, totalProfiles } = await this.profile.findAllProfile(page, limit, orderBy, sort, searchTerm);

      res.status(200).json({ data: profiles, total: totalProfiles, page, limit, message: 'findAll' });
    } catch (error) {
      next(error);
    }
  };

  public getProfileById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profileId: string = req.params.id;
      const findOneProfileData = await this.profile.findProfileById(profileId);

      res.status(200).json({ data: findOneProfileData, message: 'findOne' });
    } catch (error) {
      next(error);
    }
  };

  public updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profileId: string = req.params.id;
      const profileData = req.body;

      const updateProfileData = await this.profile.updateProfile(profileId, profileData);

      res.status(200).json({ data: updateProfileData, message: 'updated' });
    } catch (error) {
      next(error);
    }
  };

  public deleteProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profileId: string = req.params.id;
      const deleteProfileData = await this.profile.deleteProfile(profileId);

      res.status(200).json({ data: deleteProfileData, message: 'deleted' });
    } catch (error) {
      next(error);
    }
  };
}
