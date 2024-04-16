import { HttpException } from '@/exceptions/HttpException';
import { Profile } from '@/interfaces/profiles.interface';
import { ProfileModel } from '@/models/profiles.model';
import { Service } from 'typedi';

@Service()
export class AccountService {
  public async createPriceList(priceListData: any, accountId: string): Promise<Profile> {
    console.log(accountId);
    const profile = await ProfileModel.findOne({ 'Accounts._id': accountId });
    if (!profile) {
      throw new Error('Account not found');
    }

    const customId = `${priceListData.MNC}${priceListData.MCC}_${accountId}`;

    const newItem = {
      ...priceListData,
      customId: customId,
      currency: priceListData.currency || 'EUR',
    };

    const accountIndex = profile.Accounts.findIndex((acc: any) => acc._id.toString() === accountId);
    if (accountIndex === -1) {
      throw new Error('Account not found in profile');
    }

    profile.Accounts[accountIndex].priceList.push(newItem);

    await profile.save();

    return profile;
  }

  public async findAllAccountDetails(
    page: number,
    limit: number,
    orderBy: string,
    sort: string,
  ): Promise<{ accounts: any[]; totalAccounts: number }> {
    const skip = (page - 1) * limit;
    const sortDirection = sort === 'asc' ? 1 : -1;

    const accountsPromise = ProfileModel.aggregate([
      { $unwind: '$Accounts' },
      {
        $project: {
          accountData: {
            priceList: '$Accounts.priceList',
            connectionDetails: '$Accounts.connection',
            emailCoverageList: '$Accounts.emailCoverageList',
            details: '$Accounts.details',
          },
          _id: '$Accounts._id',
        },
      },
      { $sort: { [orderBy]: sortDirection } },
      { $skip: skip },
      { $limit: limit },
      {
        $group: {
          _id: '$_id',
          accounts: { $push: '$accountData' },
        },
      },
    ]).exec();

    const countPromise = ProfileModel.countDocuments();

    const [accounts, totalAccounts] = await Promise.all([accountsPromise, countPromise]);

    return { accounts, totalAccounts };
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