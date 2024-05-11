import Container, { Service } from 'typedi';

import { Account } from '../models/accounts.model';
import { Model } from 'mongoose';

@Service()
export class AccountService {
  private accountModel: Model<Account>;

  constructor() {
    this.accountModel = Container.get<Model<Account>>('AccountModel');
  }
  public async findAllAccounts({
    page,
    limit,
    orderBy = 'details.name',
    sort,
    filterOptions,
  }): Promise<{ accounts: Account[]; totalAccounts: number }> {
    const queryConditions: any = {};

    if (filterOptions.accountType) {
      queryConditions['details.accountType'] = filterOptions.accountType;
    }

    const query = this.accountModel
      .find(queryConditions)
      .select('-priceList')
      .sort({ [orderBy]: sort === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const accounts = await query.exec();
    const totalAccounts = await this.accountModel.countDocuments(queryConditions);

    return { accounts, totalAccounts };
  }

  public async findAccountById(accountId: string): Promise<Account> {
    const account = await this.accountModel.findById(accountId).select('-priceList').exec();

    return account;
  }
}
