import { AuthMiddleware } from '@/middlewares/auth.middleware';
import { ConfigurationController } from '@/controllers/configurations.controller';
import { ConfigurationDto } from '@/dtos/configurations.dto';
import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';

export class ConfigurationRoute implements Routes {
  public path = '/configurations';
  public router = Router();
  public configurationController = new ConfigurationController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, AuthMiddleware, this.configurationController.getAllConfigurations);

    this.router.put(`${this.path}`, AuthMiddleware, ValidationMiddleware(ConfigurationDto, true), this.configurationController.updateConfiguration);
  }
}
