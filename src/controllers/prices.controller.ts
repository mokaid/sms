import { NextFunction, Request, Response } from 'express';

import { Container } from 'typedi';
import { PriceService } from '@/services/prices.service';

export class PriceController {
  public price = Container.get(PriceService);

  public addPriceListItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const priceListData = req.body;
      const accountId: string = req.params.id;

      const createPriceListData = await this.price.createPriceList(priceListData, accountId);

      res.status(201).json({ data: createPriceListData, message: 'created' });
    } catch (error) {
      next(error);
    }
  };

  public getPriceDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const orderBy = (req.query.orderBy as string) || 'createdAt';
      const sort = (req.query.sort as string) || 'asc';

      const filters = {
        price: req.query.price as string,
        priceCondition: (req.query.priceCondition as string) || 'eq', // 'gt', 'lt', 'eq'
        oldPrice: req.query.oldPrice as string,
        oldPriceCondition: (req.query.oldPriceCondition as string) || 'eq', // 'gt', 'lt', 'eq'
        country: req.query.country as string,
        mnc: req.query.mnc as string,
        mcc: req.query.mcc as string,
        currency: req.query.currency as string,
      };

      Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

      const { data, total } = await this.price.findAllPricesDetailsPopulate({
        page,
        limit,
        orderBy,
        sort,
        filters,
      });

      res.status(200).json({
        data: data,
        total,
        page,
        limit,
        message: 'Prices retrieved successfully',
      });
    } catch (error) {
      console.error('Error fetching price details:', error);
      next(error);
    }
  };

  public getPriceeById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const priceId: string = req.params.id;
      const findOnePriceData = await this.price.findPriceById(priceId);

      res.status(200).json({ data: findOnePriceData, message: 'findOne' });
    } catch (error) {
      next(error);
    }
  };

  public updatePriceList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customId: string = req.params.id;
      const priceListData = req.body;

      const updatePriceListData = await this.price.updatePriceList(customId, priceListData);

      res.status(200).json({ data: updatePriceListData, message: 'updated' });
    } catch (error) {
      next(error);
    }
  };

  public deletePrice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customId: string = req.params.id;
      const deletedPrice = await this.price.deletePrice(customId);

      res.status(200).json({ data: deletedPrice, message: 'Price entry deleted successfully' });
    } catch (error) {
      next(error);
    }
  };
}
