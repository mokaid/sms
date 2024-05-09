import { NextFunction, Request, Response } from 'express';

import { AccountService } from '@/services/accounts.service';
import { Container } from 'typedi';

export class AccountController {
  public accountService = Container.get(AccountService);

  public getAccounts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const orderBy = (req.query.orderBy as string) || 'createdAt';
      const sort = (req.query.sort as string) || 'asc';
      const accountType = req.query.accountType as string;
      const fields = req.query.fields as string; // 'nameOnly' for just names, anything else for all data

      const filterOptions = {
        accountType: accountType,
        fields: fields,
      };

      const { accounts, totalAccounts } = await this.accountService.findAllAccounts({
        page,
        limit,
        orderBy,
        sort,
        filterOptions,
      });

      let responseData: any = accounts;
      if (fields === 'nameOnly') {
        responseData = accounts.map((account: any) => ({ name: account.name, _id: account._id }));
      }

      res.status(200).json({
        data: responseData,
        total: totalAccounts,
        page,
        limit,
        message: 'Accounts retrieved successfully',
      });
    } catch (error) {
      console.error('Error fetching accounts:', error);
      next(error);
    }
  };
}
