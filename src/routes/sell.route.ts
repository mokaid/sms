import { Router } from 'express';
import { SellController } from '@/controllers/sell.controller';
import { AuthMiddleware } from '@/middlewares/auth.middleware';
import { Routes } from '@interfaces/routes.interface';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';
import { SellDto } from '@/dtos/sel..dto';

export class SellRoute implements Routes {
  public path = '/sells';
  public router = Router();
  public sellController = new SellController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}`, AuthMiddleware, ValidationMiddleware(SellDto), this.sellController.createSell);
    this.router.get(`${this.path}/:id`, AuthMiddleware, this.sellController.getSellById);
    this.router.get(`${this.path}`, AuthMiddleware, this.sellController.getAllSells);
  }
}
