import { Model } from 'mongoose';
import { Inject, Service } from 'typedi';

import { Account } from '@/models/accounts.model';
import { HttpException } from '@/exceptions/HttpException';
import { Profile } from '@/models/profiles.model';
import { PriceListItem } from '@/models/prices.model';
import { Currency } from '@/enums/common.enums';

@Service()
export class PriceService {
  constructor(
    @Inject('ProfileModel') private profileModel: Model<Profile>,
    @Inject('AccountModel') private accountModel: Model<Account>,
    @Inject('PriceListItemModel') private priceListItemModel: Model<PriceListItem>,
  ) {
    if (!this.profileModel || !this.accountModel || !this.priceListItemModel) {
      console.error('Dependency injection failed:', {
        profileModel: !!this.profileModel,
        accountModel: !!this.accountModel,
        priceListItemModel: !!this.priceListItemModel,
      });
      throw new Error('Dependencies were not injected properly!');
    } else {
      console.log('loaded');
    }
  }

  public async createPriceList(priceListData: { currency: Currency }, accountId: string): Promise<PriceListItem> {
    console.log(`Creating price list for account ID: ${accountId}`);

    const session = await this.profileModel.db.startSession();
    session.startTransaction();
    try {
      const priceListItem = new this.priceListItemModel({
        ...priceListData,
        account: accountId,
        currency: priceListData.currency || 'EUR',
      });

      await priceListItem.save({ session });
      console.log('PriceListItem created:', priceListItem);

      const accountUpdateResult = await this.accountModel
        .findByIdAndUpdate(accountId, { $push: { priceList: priceListItem._id } }, { new: true, session: session })
        .exec();

      if (!accountUpdateResult) {
        throw new HttpException(404, 'Account not found or update failed');
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
        model: 'Account',
        select: 'details.name details.accountType details.businessType',
      })
      .sort({ [orderBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    const priceListItems = await query.exec();

    const total = await this.priceListItemModel.countDocuments(priceListMatch);

    return {
      data: priceListItems.map((item: any) => ({
        ...item.toObject(),
        account: item.account
          ? {
              name: item.account.details.name,
              accountType: item.account.details.accountType,
              businessType: item.account.details.businessType,
              id: item.account._id,
            }
          : null,
      })),
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

      const updates: { oldPrice: string } = {
        oldPrice: '',
      };
      for (const [key, value] of Object.entries(newPriceData)) {
        if (value !== priceListItem[key]) {
          if (key === 'price') {
            updates.oldPrice = priceListItem.price; // Set current price as oldPrice before updating
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
