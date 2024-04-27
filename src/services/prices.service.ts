import { Model } from 'mongoose';
import { Inject, Service } from 'typedi';

import { Account } from '@/models/accounts.model';
import { HttpException } from '@/exceptions/HttpException';
import { PriceListItem } from '@/models/prices.model';
import { Operator } from '@/models/operators.model';

@Service()
export class PriceService {
  constructor(
    @Inject('AccountModel') private accountModel: Model<Account>,
    @Inject('PriceListItemModel') private priceListItemModel: Model<PriceListItem>,
    @Inject('OperatorsModel') private operatorModel: Model<Operator>,
  ) {}

  public async findPriceById(priceId: string) {
    const price = await this.priceListItemModel
      .findOne({ _id: priceId })
      .populate({ path: 'operator', select: 'country MCC MNC operator' })
      .populate({ path: 'account', select: 'details.name details.accountType details.businessType details.currency' })
      .exec();
    if (!price) {
      throw new HttpException(409, "Price doesn't exist");
    }

    return price;
  }

  public async createPriceList(priceListData, accountId: string): Promise<PriceListItem> {
    console.log(`Creating price list for account ID: ${accountId}`);

    const session = await this.priceListItemModel.db.startSession();
    session.startTransaction();

    try {
      const priceListItem = new this.priceListItemModel({
        ...priceListData,
        account: accountId,
        operator: undefined,
      });

      // Find operator based on MCC and MNC
      if (priceListData.MCC && priceListData.MNC) {
        const operator = await this.operatorModel
          .findOne({
            MCC: priceListData.MCC,
            MNC: priceListData.MNC,
            active: 'True',
          })
          .session(session);

        if (operator) {
          priceListItem.operator = operator._id;
        }
      }

      await priceListItem.save({ session });
      console.log('PriceListItem created:', priceListItem);

      // Update account with new price list item
      const accountUpdateResult = await this.accountModel
        .findByIdAndUpdate(accountId, { $push: { priceList: priceListItem._id } }, { new: true, session: session })
        .exec();

      if (!accountUpdateResult) {
        throw new HttpException(404, 'Account not found or update failed');
      }

      if (priceListItem.operator) {
        await this.operatorModel.findByIdAndUpdate(priceListItem.operator, { $push: { priceList: priceListItem._id } }, { session: session });
      }

      await session.commitTransaction();
      session.endSession();
      return priceListItem;
    } catch (error) {
      console.error('Error during price list creation:', error);
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  public async findAllPricesDetailsPopulate({ page = 1, limit = 10, orderBy = 'createdAt', sort = 'asc', filters }) {
    const skip = (page - 1) * limit;
    const sortOrder = sort === 'asc' ? 1 : -1;

    const priceListMatch: Record<string, any> = {};
    if (filters.price) priceListMatch.price = { ['$' + filters.priceCondition]: parseFloat(filters.price) };
    if (filters.oldPrice) priceListMatch.oldPrice = { ['$' + filters.oldPriceCondition]: parseFloat(filters.oldPrice) };
    if (filters.country) priceListMatch.country = filters.country;
    if (filters.mnc) priceListMatch.MNC = filters.mnc;
    if (filters.mcc) priceListMatch.MCC = filters.mcc;
    if (filters.currency) priceListMatch.currency = filters.currency;

    const query = this.priceListItemModel
      .find(priceListMatch)
      .populate({
        path: 'account',
        select: 'details.name details.accountType details.businessType details.currency',
      })
      .populate({ path: 'operator', select: 'country MCC MNC operator' })

      .sort({ [orderBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    const priceListItems = await query.exec();

    const total = await this.priceListItemModel.countDocuments(priceListMatch);

    return {
      data: priceListItems,
      total,
      page,
      limit,
    };
  }

  public async deletePrice(customId: string) {
    const session = await this.priceListItemModel.db.startSession();
    session.startTransaction();
    try {
      const deletedPrice = await this.priceListItemModel.findByIdAndDelete(customId, { session });
      if (!deletedPrice) {
        throw new Error('Price item not found');
      }

      await this.accountModel.updateMany({ priceList: customId }, { $pull: { priceList: customId } }, { session });
      await this.operatorModel.updateMany({ priceList: customId }, { $pull: { priceList: customId } }, { session });

      await session.commitTransaction();
      session.endSession();

      return deletedPrice;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error('Failed to delete price:', error);
      throw error;
    }
  }

  public async updatePriceList(customId: string, newPriceData): Promise<PriceListItem> {
    const session = await this.priceListItemModel.db.startSession();
    session.startTransaction();
    try {
      const priceListItem = await this.priceListItemModel.findById(customId).session(session);

      if (!priceListItem) {
        throw new HttpException(404, 'Price list not found for the given customId');
      }

      const updates: { [x: string]: unknown; oldPrice?: string } = {};
      for (const [key, value] of Object.entries(newPriceData)) {
        if (value !== priceListItem[key]) {
          if (key === 'price') {
            updates.oldPrice = priceListItem.price;
          }
          updates[key] = value;
        }
      }

      if (Object.keys(updates).length > 0) {
        await this.priceListItemModel.updateOne({ _id: customId }, { $set: updates }, { session });
      }

      await session.commitTransaction();
      session.endSession();

      return await this.priceListItemModel.findById(customId);
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error('Failed to update price list:', error);
      throw error;
    }
  }
}
