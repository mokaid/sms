import { Document } from 'mongoose';
import { HttpException } from '@/exceptions/HttpException';
import { Profile } from '@/interfaces/profiles.interface';
import { ProfileModel } from '@/models/profiles.model';
import { Service } from 'typedi';

interface AccountDetail {
  accounts: Document[]; // Use appropriate document type
  totalAccounts: number;
}

@Service()
export class AccountService {
  public async createPriceList(priceListData: any, accountId: string): Promise<Profile> {
    console.log(`Creating price list for account ID: ${accountId}`);

    const customId = `${priceListData.MNC}${priceListData.MCC}_${accountId}`;
    console.log(`Generated customId: ${customId}`);

    const profile = await ProfileModel.findOneAndUpdate(
      {
        'Accounts._id': accountId,
        'Accounts.priceList.customId': { $ne: customId },
      },
      {
        $push: {
          'Accounts.$.priceList': {
            ...priceListData,
            customId: customId,
            currency: priceListData.currency || 'EUR',
          },
        },
      },
      { new: true, runValidators: true },
    );

    if (!profile) {
      const existingCustomId = await ProfileModel.findOne({ 'Accounts.priceList.customId': customId });
      if (existingCustomId) {
        throw new HttpException(400, 'CustomId already exists');
      }
      throw new HttpException(404, 'Account not found or invalid customId');
    }

    return priceListData;
  }

  public async findAllAccountDetails(
    page: number,
    limit: number,
    orderBy: string,
    sort: string,
    price?: string,
    priceCondition?: string,
    oldPrice?: string,
    oldPriceCondition?: string,
    country?: string,
    mnc?: string,
    mcc?: string,
    currency?: string,
  ): Promise<AccountDetail> {
    const skip = (page - 1) * limit;
    const sortDirection = sort === 'asc' ? 1 : -1;

    const pipeline: any[] = [
      { $unwind: '$Accounts' },
      { $unwind: '$Accounts.priceList' },
      {
        $match: {
          ...(price !== undefined && price !== null && { 'Accounts.priceList.price': { [`$${priceCondition || 'eq'}`]: String(price).trim() } }),
          ...(oldPrice !== undefined && { 'Accounts.priceList.oldPrice': { [`$${oldPriceCondition || 'eq'}`]: oldPrice } }),
          ...(country && { 'Accounts.priceList.country': country }),
          ...(mnc && { 'Accounts.priceList.MNC': mnc }),
          ...(mcc && { 'Accounts.priceList.MCC': mcc }),
          ...(currency && { 'Accounts.priceList.currency': currency }),
        },
      },
      {
        $project: {
          priceList: {
            customId: '$Accounts.priceList.customId',
            country: '$Accounts.priceList.country',
            MCC: '$Accounts.priceList.MCC',
            MNC: '$Accounts.priceList.MNC',
            price: '$Accounts.priceList.price',
            currency: '$Accounts.priceList.currency',
            name: '$Accounts.details.name',
            accountProfile: '$Accounts.details.accountProfile',
            userName: '$Accounts.connection.userName',
            ipAddress: '$Accounts.connection.ipAddress',
            email: '$Accounts.emailCoverageList.email',
          },
          _id: 0,
        },
      },
      { $sort: { [`priceList.${orderBy}`]: sortDirection } },
      { $skip: skip },
      { $limit: limit },
      {
        $group: {
          _id: null,
          accounts: { $push: '$priceList' },
        },
      },
    ];

    const accountsPromise = ProfileModel.aggregate(pipeline).exec();
    const countPipeline = [...pipeline.slice(0, 4), { $count: 'totalPriceLists' }];
    const countPromise = ProfileModel.aggregate(countPipeline).exec();

    const [accounts, totalAccounts] = await Promise.all([accountsPromise, countPromise]);

    return { accounts, totalAccounts: totalAccounts[0] ? totalAccounts[0].totalPriceLists : 0 };
  }

  public async updatePriceList(customId: string, newPriceData): Promise<Profile> {
    if (!newPriceData.price && !newPriceData.currency) {
      throw new HttpException(400, 'No valid update data provided');
    }

    const existingProfile = await ProfileModel.findOne(
      {
        'Accounts.priceList.customId': customId,
      },
      'Accounts.$',
    );

    if (!existingProfile || !existingProfile.Accounts || !existingProfile.Accounts[0].priceList) {
      throw new HttpException(404, 'No valid account or price list found for the given ID');
    }

    const currentPriceList = existingProfile.Accounts[0].priceList.find(pl => pl.customId === customId);
    if (!currentPriceList) {
      throw new HttpException(404, 'Price list not found for the given customId');
    }

    const updateFields = {};

    if (newPriceData.price && newPriceData.price !== currentPriceList.price) {
      updateFields['Accounts.$.priceList.0.oldPrice'] = currentPriceList.price;
      updateFields['Accounts.$.priceList.0.price'] = newPriceData.price;
    }

    if (newPriceData.currency) {
      updateFields['Accounts.$.priceList.0.currency'] = newPriceData.currency;
    }

    const updatedProfile = await ProfileModel.findOneAndUpdate(
      { 'Accounts.priceList.customId': customId },
      { $set: updateFields },
      { new: true, arrayFilters: [{ 'Accounts.priceList.customId': customId }], runValidators: true },
    );

    if (!updatedProfile) {
      throw new HttpException(409, 'Unable to update price list');
    }

    return updatedProfile;
  }

  public async deletePrice(customId: string): Promise<Profile> {
    const profileContainingPrice = await ProfileModel.findOne({
      'Accounts.priceList.customId': customId,
    });

    if (!profileContainingPrice) {
      throw new HttpException(404, 'Profile containing the specified price not found');
    }

    const updatedProfile = await ProfileModel.findOneAndUpdate(
      { 'Accounts.priceList.customId': customId },
      { $pull: { 'Accounts.$.priceList': { customId: customId } } },
      { new: true },
    );

    if (!updatedProfile) {
      throw new HttpException(409, 'Failed to delete price entry');
    }

    return updatedProfile;
  }
}
