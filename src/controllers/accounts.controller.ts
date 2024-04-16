import { NextFunction, Request, Response } from 'express';

import { AccountService } from '@/services/accounts.service';
import { Container } from 'typedi';
import { Profile } from '@/interfaces/profiles.interface';

export class AccountController {
  public account = Container.get(AccountService);

  public addPriceListItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const priceListData: Profile = req.body;
      const accountId: string = req.params.id;

      const createPriceListData: Profile = await this.account.createPriceList(priceListData, accountId);

      res.status(201).json({ data: createPriceListData, message: 'created' });
    } catch (error) {
      next(error);
    }
  };

  public getAccountDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const orderBy = (req.query.orderBy as string) || 'createdAt';
      const sort = (req.query.sort as string) || 'asc';

      const price = req.query.price as string;
      const priceCondition = (req.query.priceCondition as string) || 'eq'; // Can be 'gt', 'lt', 'eq'

      const oldPrice = req.query.oldPrice as string;
      const oldPriceCondition = (req.query.oldPriceCondition as string) || 'eq'; // Can be 'gt', 'lt', 'eq'

      const country = req.query.country as string;
      const mnc = req.query.mnc as string;
      const mcc = req.query.mcc as string;
      const currency = req.query.currency as string;

      const { accounts, totalAccounts } = await this.account.findAllAccountDetails(
        page,
        limit,
        orderBy,
        sort,
        price,
        priceCondition,
        oldPrice,
        oldPriceCondition,
        country,
        mnc,
        mcc,
        currency,
      );

      res.status(200).json({
        data: accounts,
        total: totalAccounts,
        page,
        limit,
        message: 'findAll',
      });
    } catch (error) {
      next(error);
    }
  };

  public updatePriceList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customId: string = req.params.id;
      const priceListData: Profile = req.body;

      const updatePriceListData: Profile = await this.account.updatePriceList(customId, priceListData);

      res.status(200).json({ data: updatePriceListData, message: 'updated' });
    } catch (error) {
      next(error);
    }
  };

  public deletePrice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customId: string = req.params.id;
      const updatedProfile: Profile = await this.account.deletePrice(customId);

      res.status(200).json({ data: updatedProfile, message: 'Price entry deleted successfully' });
    } catch (error) {
      next(error);
    }
  };
}
