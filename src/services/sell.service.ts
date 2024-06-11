import Container, { Service } from 'typedi';
import { Model } from 'mongoose';
import { Sell } from '@/models/sell.model';
import { HttpException } from '@/exceptions/HttpException';
import { Account } from '@/models/accounts.model';
import { PriceListItem } from '@/models/prices.model';

@Service()
export class SellService {
  private sellModel: Model<Sell>;

  constructor() {
    this.sellModel = Container.get<Model<Sell>>('SellModel');
  }

  public async createSell(account: Account, priceItems: PriceListItem[]) {

    console.log(account, priceItems)
    const session = await this.sellModel.db.startSession();
    session.startTransaction();
    try {
      const sell = new this.sellModel({  
        account,
        priceItems,
      });
      await sell.save({ session });

      await session.commitTransaction();
      return sell;
    } catch (error) {
      await session.abortTransaction();
      console.error('Error during sell creation:', error);
      throw new HttpException(500, 'Error during sell creation');
    } finally {
      session.endSession();
    }
  }

  public async findSellById(sellId: string) {
    try {
      const sell = await this.sellModel.findById(sellId).exec();
      if (!sell) {
        throw new HttpException(404, "Sell record doesn't exist");
      }
      return sell;
    } catch (error) {
      console.error('Error finding sell by ID:', error);
      throw new HttpException(500, 'Error finding sell by ID');
    }
  }

  public async findAllSells({ page = 1, limit = 10, orderBy = 'createdAt', sortOrder = 'asc', filters = {} }) {
    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const sellFilters: Record<string, any> = {};
    Object.keys(filters).forEach(key => {
      if (typeof filters[key] === 'string' && filters[key]) {
        sellFilters[key] = filters[key];
      } else if (typeof filters[key] === 'boolean') {
        sellFilters[key] = filters[key];
      }
    });

    try {
      const query = this.sellModel
        .find(sellFilters)
        .sort({ [orderBy]: sortDirection })
        .skip(skip)
        .limit(limit);

      const sells = await query.exec();
      const total = await this.sellModel.countDocuments(sellFilters);

      return {
        data: sells,
        total,
      };
    } catch (error) {
      console.error('Error finding all sells:', error);
      throw new HttpException(500, 'Error finding all sells');
    }
  }
}
