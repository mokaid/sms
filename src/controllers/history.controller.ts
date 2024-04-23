import { NextFunction, Request, Response } from 'express';

import Container from 'typedi';
import { HistoryService } from '@/services/history.service';

export class HistoryController {
  public history = Container.get(HistoryService);

  public getHistoryById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refId: string = req.params.id;
      const findHistoryData = await this.history.findHistoryById(refId);

      res.status(200).json({ data: findHistoryData, message: 'findOne' });
    } catch (error) {
      next(error);
    }
  };
}
