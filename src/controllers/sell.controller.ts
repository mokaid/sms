import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { SellService } from '@/services/sell.service';

export class SellController {
  public sellService = Container.get(SellService);

  public createSell = async (req: Request, res: Response, next: NextFunction) => {
    try {

      const { account, priceItems } = req.body;
      const createSellData = await this.sellService.createSell(account, priceItems);

      res.status(201).json({ data: createSellData, message: 'Sell created successfully' });
    } catch (error) {
      next(error);
    }
  };

  public getSellById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sellId: string = req.params.id;
      const sellData = await this.sellService.findSellById(sellId);

      res.status(200).json({ data: sellData, message: 'Sell retrieved successfully' });
    } catch (error) {
      next(error);
    }
  };

  public getAllSells = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const orderBy = (req.query.orderBy as string) || 'createdAt';
      const sortOrder = (req.query.sortOrder as string) || 'asc';
      const filters = req.query.filters ? JSON.parse(req.query.filters as string) : {};

      const { data, total } = await this.sellService.findAllSells({
        page,
        limit,
        orderBy,
        sortOrder,
        filters,
      });

      res.status(200).json({
        data,
        total,
        page,
        limit,
        message: 'Sells retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
