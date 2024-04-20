import { Document, Model } from 'mongoose';
import { Inject, Service } from 'typedi';

import { Account } from '@/models/accounts.model';
import { HttpException } from '@/exceptions/HttpException';
import { Mode } from 'fs';
import { PriceListItem } from '@/models/prices.model';
import { Profile } from '@/models/profiles.model';
import { Container } from 'typedi';

interface AccountDetail {
  accounts: Document[]; // Use appropriate document type
  totalAccounts: number;
}
Container.set('ProfileModel', Profile);
Container.set('AccountModel', Account);
Container.set('PriceListItemModel', PriceListItem);

@Service()
export class AccountService {
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
    }
  }

  public async createPriceList(priceListData: any, accountId: string): Promise<PriceListItem> {
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

  public async findAllAccountDetailsPopulate({ page = 1, limit = 10, orderBy = 'createdAt', sort = 'asc', filters = {} }) {
    const skip = (page - 1) * limit;
    const sortOrder = sort === 'asc' ? 1 : -1;

    // Construct match conditions for price list filtering
    const priceListMatch = {};
    if (filters.price) priceListMatch.price = { ['$' + filters.priceCondition]: parseFloat(filters.price) };
    if (filters.oldPrice) priceListMatch.oldPrice = { ['$' + filters.oldPriceCondition]: parseFloat(filters.oldPrice) };
    if (filters.country) priceListMatch.country = filters.country;
    if (filters.mnc) priceListMatch.MNC = filters.mnc;
    if (filters.mcc) priceListMatch.MCC = filters.mcc;
    if (filters.currency) priceListMatch.currency = filters.currency;

    // Perform the query with pagination and sorting using the correct model
    const query = this.priceListItemModel
      .find(priceListMatch)
      .populate({
        path: 'account',
        model: 'Account',
        select: 'details.name details.accountType details.businessType', // Adjusted to correctly point to nested fields
      })
      .sort({ [orderBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    // Execute the query to get price list items with account details
    const priceListItems = await query.exec();

    // Count the total matching price list items
    const total = await this.priceListItemModel.countDocuments(priceListMatch);

    // Return the formatted result

    console.log(JSON.stringify(priceListItems));
    return {
      data: priceListItems.map(item => ({
        ...item.toObject(), // Convert to a regular object if not already
        account: item.account
          ? {
              name: item.account.details.name, // Accessing the nested fields
              accountType: item.account.details.accountType,
              businessType: item.account.details.businessType,
              id: item.account._id, // Include the Account ID in the output
            }
          : null, // Handle cases where the account might not be found
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
      // Delete the price list item from the PriceListItemModel
      const deletedPrice = await this.priceListItemModel.findByIdAndDelete(customId, { session });
      if (!deletedPrice) {
        throw new Error('Price item not found');
      }

      // Update all accounts to remove the deleted price list item ID
      const updatedAccounts = await this.accountModel.updateMany({ priceList: customId }, { $pull: { priceList: customId } }, { session });

      // Commit the transaction and end the session
      await session.commitTransaction();
      session.endSession();

      // Return the number of documents deleted and updated
      return deletedPrice;
    } catch (error) {
      // Abort the transaction and end the session on error
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
      // Find the price list item by customId
      const priceListItem = await this.priceListItemModel.findById(customId).session(session);

      if (!priceListItem) {
        throw new HttpException(404, 'Price list not found for the given customId');
      }

      // Prepare update object and check what needs to be updated
      const updates = {};
      for (const [key, value] of Object.entries(newPriceData)) {
        if (value !== priceListItem[key]) {
          if (key === 'price') {
            updates.oldPrice = priceListItem.price; // Set current price as oldPrice before updating
          }
          updates[key] = value;
        }
      }

      // If there are updates, apply them
      if (Object.keys(updates).length > 0) {
        await this.priceListItemModel.updateOne({ _id: customId }, { $set: updates }, { session });
      }

      // Commit the transaction and end the session
      await session.commitTransaction();
      session.endSession();

      // Return the updated price list item
      return await this.priceListItemModel.findById(customId);
    } catch (error) {
      // Abort the transaction in case of an error
      await session.abortTransaction();
      session.endSession();
      console.error('Failed to update price list:', error);
      throw error; // Ensure that the error is thrown again to be caught by the caller
    }
  }
}
