import { AuthMiddleware } from '@/middlewares/auth.middleware';
import { PriceController } from '@/controllers/prices.controller';
import { PriceListDetailsDto } from '@/dtos/prices.dto';
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
    this.router.get(`${this.path}`, AuthMiddleware, this.price.getPriceDetails);
    this.router.get(`${this.path}/:id`, AuthMiddleware, this.price.getPriceeById);
    this.router.post(`${this.path}/fetchByIds`, AuthMiddleware, this.price.getPricesByIds);

    this.router.post(`${this.path}/:id`, AuthMiddleware, ValidationMiddleware(PriceListDetailsDto), this.price.addPriceListItem);
    this.router.put(`${this.path}/byMccMnc`, AuthMiddleware, this.price.updatePricesByMccMnc);

    this.router.put(`${this.path}/:id`, AuthMiddleware, ValidationMiddleware(PriceListDetailsDto, true), this.price.updatePriceList);

    this.router.delete(`${this.path}/:id`, AuthMiddleware, this.price.deletePrice);
  }
}
