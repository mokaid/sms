import { NextFunction, Request, Response } from 'express';

import { AccountService } from '@/services/accounts.service';
import { Container } from 'typedi';
import { Profile } from '@/interfaces/profiles.interface';

export class AccountController {
  public account = Container.get(AccountService);

  public getAccountDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const orderBy = (req.query.orderBy as string) || 'createdAt';
      const sort = (req.query.sort as string) || 'asc';

      const { accounts, totalAccounts } = await this.account.findAllAccountDetails(page, limit, orderBy, sort);

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
