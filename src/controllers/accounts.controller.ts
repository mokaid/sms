import { NextFunction, Request, Response } from 'express';

import { AccountService } from '@/services/accounts.service';
import { Container } from 'typedi';
import { HttpException } from '@/exceptions/HttpException';
import { Types } from 'mongoose';

export class AccountController {
  public accountService = Container.get(AccountService);

  public getAccounts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const orderBy = (req.query.orderBy as string) || 'createdAt';
      const sort = (req.query.sort as string) || 'asc';
      const accountType = req.query.accountType as string;
      const nameOnly = req.query.nameOnly as string; // 'nameOnly' for just names, anything else for all data

      const filterOptions = {
        accountType: accountType,
        fields: nameOnly,
      };

      const { accounts, totalAccounts } = await this.accountService.findAllAccounts({
        page,
        limit,
        orderBy,
        sort,
        filterOptions,
      });

      console.log(nameOnly, accountType, req.query);
      let responseData: any = accounts;
      if (nameOnly === 'true') {
        responseData = accounts.map((account: any) => ({
          name: account.details.name,
          _id: account._id,
        }));
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

  public getAccountById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = req.params.id;

      if (!Types.ObjectId.isValid(accountId)) {
        throw new HttpException(400, 'Invalid Account ID');
      }

      const account = await this.accountService.findAccountById(accountId);
      if (!account) {
        throw new HttpException(404, 'Account not found');
      }

      res.status(200).json({
        data: account,
        message: 'Account retrieved successfully',
      });
    } catch (error) {
      console.error('Error fetching account:', error);
      next(error);
    }
  };
}
