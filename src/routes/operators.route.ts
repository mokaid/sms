import { AuthMiddleware } from '@/middlewares/auth.middleware';
import { OperatorsController } from '@/controllers/operators.controller';
import { OperatorsDto } from '@/dtos/operators.dto'; // Ensure you have this DTO set up
import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';

export class OperatorsRoute implements Routes {
  public path = '/operators';
  public router = Router();
  public operatorsController = new OperatorsController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, AuthMiddleware, this.operatorsController.getOperators);
    this.router.get(`${this.path}/:id`, AuthMiddleware, this.operatorsController.getOperatorById);

    this.router.post(`${this.path}`, AuthMiddleware, ValidationMiddleware(OperatorsDto), this.operatorsController.addOperator);
    this.router.put(`${this.path}/:id`, AuthMiddleware, ValidationMiddleware(OperatorsDto, true), this.operatorsController.updateOperator);
  }
}
