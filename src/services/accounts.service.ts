import { Service, Inject } from 'typedi';
import { Account } from '../models/accounts.model';
import { Model } from 'mongoose';

@Service()
export class AccountService {
  constructor(@Inject('AccountModel') private accountModel: Model<Account>) {}

  public async findAllAccounts({ page, limit, orderBy, sort, filterOptions }): Promise<{ accounts: Account[]; totalAccounts: number }> {
    const queryConditions: any = {};
    if (filterOptions.accountType) {
      queryConditions.accountType = filterOptions.accountType;
    }

    const query = this.accountModel
      .find(queryConditions)
      .sort({ [orderBy]: sort === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const accounts = await query.exec();
    const totalAccounts = await this.accountModel.countDocuments(queryConditions);

    return { accounts, totalAccounts };
  }
}
