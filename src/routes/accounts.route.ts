import { AccountController } from '@/controllers/accounts.controller';
import { AuthMiddleware } from '@/middlewares/auth.middleware';
import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';

export class AccountRoute implements Routes {
  public path = '/accounts';
  public router = Router();
  public accountController = new AccountController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, AuthMiddleware, this.accountController.getAccounts);
  }
}
