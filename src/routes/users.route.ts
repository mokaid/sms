import { AuthMiddleware } from '@/middlewares/auth.middleware';
import { CreateUserDto } from '@dtos/users.dto';
import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import { UserController } from '@controllers/users.controller';
import { ValidationMiddleware } from '@middlewares/validation.middleware';

export class UserRoute implements Routes {
  public path = '/users';
  public router = Router();
  public user = new UserController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, AuthMiddleware, this.user.getUsers);
    this.router.get(`${this.path}/:id`, AuthMiddleware, this.user.getUserById);
    this.router.post(`${this.path}`, AuthMiddleware, ValidationMiddleware(CreateUserDto), this.user.createUser);
    this.router.put(`${this.path}/:id`, AuthMiddleware, ValidationMiddleware(CreateUserDto, true), this.user.updateUser);
    this.router.delete(`${this.path}/:id`, AuthMiddleware, this.user.deleteUser);
  }
}
