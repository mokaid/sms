import { AuthMiddleware } from '@/middlewares/auth.middleware';
import { ProfileDto } from '@/dtos/profiles.dto';
import { ProfleController } from '@/controllers/profiles.controller';
import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import { ValidationMiddleware } from '@middlewares/validation.middleware';

export class ProfileRoute implements Routes {
  public path = '/profiles';
  public router = Router();
  public profile = new ProfleController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, this.profile.getProfile);
    this.router.get(`${this.path}/:id`, this.profile.getPofileById);
    this.router.post(`${this.path}`, ValidationMiddleware(ProfileDto), this.profile.createProfile);
    this.router.put(`${this.path}/:id`, ValidationMiddleware(ProfileDto, true), this.profile.updateProfile);

    this.router.delete(`${this.path}/:id`, this.profile.deleteProfile);
  }
}
