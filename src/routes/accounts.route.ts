import { AccountController } from '@/controllers/accounts.controller';
import { AuthMiddleware } from '@/middlewares/auth.middleware';
import { ProfileDto } from '@/dtos/profiles.dto';
import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';

export class AccountRoute implements Routes {
  public path = '/accounts';
  public router = Router();
  public account = new AccountController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, AuthMiddleware, this.account.getAccountDetails);
    this.router.post(`${this.path}/:id`, AuthMiddleware, ValidationMiddleware(ProfileDto), this.account.addPriceListItem);

    this.router.put(`${this.path}/:id`, AuthMiddleware, this.account.updatePriceList);

    this.router.delete(`${this.path}/:id`, AuthMiddleware, this.account.deletePrice);
  }
}
