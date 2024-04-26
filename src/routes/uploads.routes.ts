import { AuthMiddleware } from '@/middlewares/auth.middleware';
import { OperatorsDto } from '@/dtos/operators.dto';
import { Router } from 'express';
import { Routes } from '@/interfaces/routes.interface';
import { UploadController } from '@/controllers/uploads.controller';
import { UploadPriceListDto } from '@/dtos/uploads.dto';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';
import multer from 'multer';

export class UploadRoute implements Routes {
  public path = '/upload';
  public router = Router();
  public upload = new UploadController();
  private uploader = multer({ storage: multer.memoryStorage() });

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      `${this.path}/priceList`,
      this.uploader.single('file'),
      ValidationMiddleware(UploadPriceListDto),
      AuthMiddleware,
      this.upload.uploadPriceList,
    );

    this.router.post(
      `${this.path}/operators`,
      this.uploader.single('file'),
      ValidationMiddleware(OperatorsDto),
      AuthMiddleware,
      this.upload.uploadOperators,
    );
  }
}
