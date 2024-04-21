import { AuthMiddleware } from '@/middlewares/auth.middleware';
import { PriceController } from '@/controllers/prices.controller';
import { ProfileDto } from '@/dtos/profiles.dto';
import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';

export class PriceRoute implements Routes {
  public path = '/prices';
  public router = Router();
  public price = new PriceController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, AuthMiddleware, this.price.getAccountDetails);
    this.router.post(`${this.path}/:id`, AuthMiddleware, ValidationMiddleware(ProfileDto), this.price.addPriceListItem);
    this.router.put(`${this.path}/:id`, AuthMiddleware, this.price.updatePriceList);
    this.router.delete(`${this.path}/:id`, AuthMiddleware, this.price.deletePrice);
  }
}
