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
    this.router.post(`${this.path}`, AuthMiddleware, ValidationMiddleware(ProfileDto), this.profile.createProfile);
  }
}
