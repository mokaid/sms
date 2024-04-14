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

  //   async function getFullAccountsDetails(page, limit) {
  //     const skip = (page - 1) * limit;

  //     try {
  //         const results = await ProfileModel.aggregate([
  //             { $unwind: "$Accounts" }, // Flatten the Accounts array
  //             { $project: {
  //                 "priceList": "$Accounts.priceList",
  //                 "connection": "$Accounts.connection",
  //                 "emailCoverageList": "$Accounts.emailCoverageList",
  //                 "accountDetails": "$Accounts.details",  // Adding account details projection
  //                 "_id": 0
  //             }}, // Project necessary fields
  //             { $skip: skip }, // Pagination: skip
  //             { $limit: limit } // Pagination: limit
  //         ]);

  //         return results;
  //     } catch (error) {
  //         console.error("Error in fetching full accounts details:", error);
  //         throw error;
  //     }
  // }

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

  public getAccountDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const orderBy = (req.query.orderBy as string) || 'createdAt';
      const sort = (req.query.sort as string) || 'asc';

      const { accounts, totalAccounts } = await this.profile.findAllAccountDetails(page, limit, orderBy, sort);

      res.status(200).json({
        data: accounts,
        total: totalAccounts,
        page,
        limit,
        message: 'findAll',
      });
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
