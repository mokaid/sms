import { NextFunction, Response } from 'express';

import { Container } from 'typedi';
import { HttpException } from '@/exceptions/HttpException';
import { UploadFile } from '@/interfaces/uploads.interface';
import { UploadsService } from '@/services/uploads.service';

export class UploadController {
  public uploadService = Container.get(UploadsService);

  public uploadPriceList = async (req, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw new HttpException(400, 'No Excel file uploaded');

      const uploadFile: UploadFile = {
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
      };

      const accountId: string = req.body.accountId;
      if (!accountId) throw new HttpException(400, 'Account ID is required');

      const processedData = await this.uploadService.processRatesFile(uploadFile, accountId);
      res.status(200).json({ data: processedData, message: 'Excel file processed successfully' });
    } catch (error) {
      next(error);
    }
  };

  public uploadOperators = async (req, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw new HttpException(400, 'No Excel file uploaded');

      const uploadFile: UploadFile = {
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
      };

      const SchemaConfig: string = JSON.parse(req.body.SchemaConfig);

      if (!SchemaConfig) throw new HttpException(400, 'Schema Config is required');

      const processedData = await this.uploadService.processOperatorsFile(uploadFile, SchemaConfig);
      res.status(200).json({ data: processedData, message: 'Excel file processed successfully' });
    } catch (error) {
      next(error);
    }
  };
}
