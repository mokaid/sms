import { AuthMiddleware } from '@/middlewares/auth.middleware';
import { HistoryController } from '@/controllers/history.controller';
import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';

export class HistoryRoute implements Routes {
  public path = '/history';
  public router = Router();
  public history = new HistoryController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/:id`, AuthMiddleware, this.history.getHistoryById);
  }
}
