import { AuthMiddleware } from '@/middlewares/auth.middleware';
import { ProfleController } from '@/controllers/profiles.controller';
import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';

export class AccountRoute implements Routes {
  public path = '/accounts';
  public router = Router();
  public profile = new ProfleController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, AuthMiddleware, this.profile.getAccountDetails);
  }
}
