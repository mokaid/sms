import { ParsedItem, SchemaConfig } from '@/interfaces/email.interface';

import { HttpException } from '@/exceptions/HttpException';
import { ParsedMail } from 'mailparser';
import { Service, Inject } from 'typedi';
import 'reflect-metadata';
import mongoose, { Model } from 'mongoose';
import { Account } from '@/models/accounts.model';
import { PriceListItem } from '@/models/prices.model';
import { Profile } from '@/models/profiles.model';
import { FileFormat } from '@/enums/accounts.enums';

import xlsx from 'xlsx';
import { AccountDto } from '@/dtos/accounts.dto';

@Service()
export class ProfileService {
  constructor(
    @Inject('ProfileModel') private profileModel: Model<Profile>,
    @Inject('AccountModel') private accountModel: Model<Account>,
    @Inject('PriceListItemModel') private priceListItemModel: Model<PriceListItem>,
  ) {}

  public async createProfile(profileData: { ProfileDetails: { accountingReference: string }; Accounts: AccountDto[] }): Promise<Profile> {
    const session = await this.profileModel.db.startSession();
    session.startTransaction();
    try {
      const existingProfile = await this.profileModel
        .findOne(
          {
            'profileDetails.accountingReference': profileData.ProfileDetails.accountingReference,
          },
          null,
          { session },
        )
        .exec();

      if (existingProfile) {
        await session.abortTransaction();
        session.endSession();
        throw new HttpException(409, 'This profile already exists');
      }

      const profile = new this.profileModel(profileData);

      await profile.save({ session });
      console.log('Created Profile with ID:', profile._id);

      const accounts = profileData.Accounts.map(async accountData => {
        console.log(accountData.connection.userName);
        if (accountData.details.accountType === 'Vendor') {
          if (!accountData.emailCoverageList) {
            throw new HttpException(400, 'Vendors must have an email coverage list.');
          }
          if (!accountData.connection.ipAddress) {
            throw new HttpException(400, 'Vendors must have an IP address.');
          }
          if (accountData.connection.port === undefined || accountData.connection.port === null) {
            throw new HttpException(400, 'Vendors must have a port.');
          }
        }

        const account = new this.accountModel({
          ...accountData,
          profile: profile._id,
        });
        await account.save({ session });
        console.log('Account saved:', account);
        return account._id;
      });

      const savedAccountIds = await Promise.all(accounts);
      profile.accounts = savedAccountIds;
      await profile.save({ session });

      await session.commitTransaction();
      session.endSession();
      console.log('Transaction committed and session ended');

      return this.profileModel.findById(profile._id).populate('accounts').exec();
    } catch (error) {
      console.error('Error during profile creation:', error);
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  public async findAllProfile(
    page: number,
    limit: number,
    orderBy: string,
    sort: string,
    searchTerm: string,
  ): Promise<{ profiles: Profile[]; totalProfiles: number }> {
    const skip = (page - 1) * limit;
    const sortDirection = sort === 'asc' ? 1 : -1;

    const searchableFields = [
      'ProfileDetails.legalName',
      'ProfileDetails.accountingReference',
      'ProfileDetails.address',
      'ProfileDetails.vatRegistrationNumber',
      'ProfileDetails.phoneNumber',
      'ProfileDetails.currency',
    ];

    const searchQuery = {
      $or: searchableFields.map(field => ({
        [field]: { $regex: searchTerm, $options: 'i' }, // Corrected: Options are now only specified here
      })),
    };

    const profilesPromise = this.profileModel
      .find(searchQuery)
      // .populate({
      //   path: 'accounts',
      //   select: { priceList: 0 },
      // populate: {
      //   path: 'priceList',
      //   model: 'PriceListItem', // Ensure this is the correct name of your price list model
      // },
      //})
      .skip(skip)
      .limit(limit)
      .sort({ [orderBy]: sortDirection })
      .exec();

    const countPromise = this.profileModel.countDocuments(searchQuery);

    const [profiles, totalProfiles] = await Promise.all([profilesPromise, countPromise]);
    return { profiles, totalProfiles };
  }

  public async findProfileById(profileId: string): Promise<Profile> {
    const profile = await this.profileModel
      .findOne({ _id: profileId })
      .populate({
        path: 'accounts',
        populate: {
          path: 'priceList',
          model: 'PriceListItem',
        },
      })
      .exec();

    if (!profile) {
      throw new HttpException(409, "Profile doesn't exist");
    }

    return profile;
  }

  public async deleteProfile(profileId: string): Promise<Profile> {
    const session = await this.profileModel.db.startSession();
    session.startTransaction();
    try {
      const deleteProfileById = await this.profileModel.findByIdAndDelete(profileId, { session });
      if (!deleteProfileById) {
        throw new HttpException(409, "Profile doesn't exist");
      }

      const relatedAccounts = await this.accountModel.find({ profile: profileId }, '_id', { session }).exec();
      const accountIds = relatedAccounts.map(account => account._id);

      const accountsDeletion = await this.accountModel.deleteMany({ _id: { $in: accountIds } }, { session });
      console.log(`${accountsDeletion.deletedCount} accounts deleted.`);

      const priceListsDeletion = await this.priceListItemModel.deleteMany({ account: { $in: accountIds } }, { session });
      console.log(`${priceListsDeletion.deletedCount} price lists deleted.`);

      await session.commitTransaction();
      session.endSession();

      return deleteProfileById;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error('Failed to delete profile:', error);
      throw error;
    }
  }

  public async updateProfile(
    profileId: string,
    profileData: { ProfileDetails: { accountingReference: string }; Accounts: AccountDto[] },
  ): Promise<Profile> {
    const session = await this.profileModel.db.startSession();
    session.startTransaction();

    try {
      const existingProfile = await this.profileModel.findOne(
        {
          'ProfileDetails.accountingReference': profileData.ProfileDetails.accountingReference,
          _id: { $ne: profileId },
        },
        null,
        { session },
      );

      if (existingProfile) {
        throw new HttpException(409, 'This profile already exists with the same accounting reference.');
      }

      const updateProfileById = await this.profileModel.findByIdAndUpdate(profileId, { $set: profileData }, { new: true, session });

      if (!updateProfileById) {
        throw new HttpException(409, "Profile doesn't exist.");
      }

      const existingAccounts = updateProfileById.accounts || [];

      const updatedAccounts = [];

      for (const accountData of profileData.Accounts) {
        const existingAccount = await this.accountModel.findOne(
          {
            'connection.userName': accountData.connection.userName,
            _id: { $ne: accountData._id },
            profile: profileId,
          },
          null,
          { session },
        );

        if (existingAccount && existingAccount._id.toString() !== accountData._id) {
          throw new HttpException(409, `Username ${accountData.connection.userName} is already in use.`);
        }

        let savedAccount: mongoose.Document<unknown, any, Account> & Omit<Account & { _id: mongoose.Types.ObjectId }, never>;
        if (accountData._id && existingAccounts.includes(accountData._id as any)) {
          savedAccount = await this.accountModel.findByIdAndUpdate(accountData._id, accountData, { new: true, session });
        } else {
          savedAccount = await new this.accountModel({ ...accountData, profile: profileId }).save({ session });
        }
        updatedAccounts.push(savedAccount._id.toString());
      }

      const accountsToRemove = existingAccounts.filter(id => !updatedAccounts.includes(id.toString()));
      await this.accountModel.deleteMany({ _id: { $in: accountsToRemove } }, { session });

      await this.profileModel.findByIdAndUpdate(profileId, { $set: { accounts: updatedAccounts } }, { session });

      await this.priceListItemModel.deleteMany({ account: { $in: accountsToRemove } }, { session });

      await session.commitTransaction();
      session.endSession();
      return updateProfileById;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  public async findProfileByAccountID(accountId: string): Promise<Profile> {
    const session = await this.profileModel.db.startSession();
    session.startTransaction();

    try {
      const objectId = new mongoose.Types.ObjectId(accountId);

      const profile = await this.profileModel
        .findOne({ accounts: objectId })
        .populate({
          path: 'accounts',
          match: { _id: objectId },
          select: 'details emailCoverageList connection SchemaConfig',
        })
        .select({ 'accounts.$': 1, SchemaConfig: 1 })
        .session(session)
        .exec();
      if (!profile) {
        await session.abortTransaction();
        session.endSession();
        throw new Error('Profile not found for the given account ID');
      }

      await session.commitTransaction();
      session.endSession();
      return profile;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  public parseCsvWithSchema(content: Buffer | unknown[], schemaConfig: SchemaConfig): ParsedItem[] {
    const lines: string[] = content
      .toString('utf8')
      .split('\n')
      .filter(line => line.trim() !== '');
    const headers: string[] = lines[schemaConfig.headerRow - 1].split(',').map(header => header.trim().replace(/^"|"$/g, ''));

    const columnIndexMap: { [key: string]: number } = {};
    Object.entries(schemaConfig.fields).forEach(([fieldName, possibleHeaders]) => {
      columnIndexMap[fieldName] = headers.findIndex(header => possibleHeaders.some(possibleHeader => possibleHeader === header));
    });

    return lines.slice(schemaConfig.headerRow).map(line => {
      const data = line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
      const obj: Partial<ParsedItem> = {};
      Object.entries(columnIndexMap).forEach(([fieldName, index]) => {
        if (index >= 0) {
          obj[fieldName as keyof ParsedItem] = data[index];
        }
      });

      if (!obj.currency) obj.currency = 'EUR';

      return obj as ParsedItem;
    });
  }

  public async updatePriceList(accountId: string, newPriceListItems: any[], deleteAllExisting: boolean): Promise<void> {
    const session = await this.priceListItemModel.db.startSession();
    session.startTransaction();
    try {
      const accountObjectId = new mongoose.Types.ObjectId(accountId);

      const currentPrices = await this.priceListItemModel.find({ account: accountObjectId }).session(session);

      if (deleteAllExisting) {
        await this.priceListItemModel.deleteMany({ account: accountObjectId }, { session: session });

        await this.accountModel.findByIdAndUpdate(accountId, { $set: { priceList: [] } }, { session: session });

        const newItems = newPriceListItems.map(item => ({
          ...item,
          account: accountObjectId,
        }));

        const insertedItems = await this.priceListItemModel.insertMany(newItems, { session: session });

        const newItemIds = insertedItems.map(item => item._id);
        await this.accountModel.findByIdAndUpdate(accountId, { $push: { priceList: { $each: newItemIds } } }, { session: session });
      } else {
        const priceMap = new Map(currentPrices.map(item => [item.MCC + '_' + item.MNC, item]));

        for (const item of newPriceListItems) {
          const key = item.MCC + '_' + item.MNC;
          const existingPrice = priceMap.get(key);

          if (existingPrice) {
            if (existingPrice.price !== item.price) {
              existingPrice.oldPrice = existingPrice.price;
              existingPrice.price = item.price;
              await existingPrice.save({ session: session });
            }
          } else {
            const newItem = new this.priceListItemModel({
              ...item,
              account: accountObjectId,
            });
            await newItem.save({ session: session });
            await this.accountModel.findByIdAndUpdate(accountId, { $push: { priceList: newItem._id } }, { session: session });
          }
        }
      }

      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
  public async findProfileByAccountEmail(accountEmail: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const session = await this.profileModel.db.startSession();
    try {
      session.startTransaction();

      const account = await this.accountModel.findOne({ 'emailCoverageList.email': accountEmail }).session(session).exec();

      if (!account) {
        await session.endSession();
        return { success: false, error: 'Account not found for the given email' };
      }

      const objectId = new mongoose.Types.ObjectId(account._id);

      const profile = await this.profileModel
        .findById(account.profile)
        .populate({
          path: 'accounts',
          match: { _id: objectId },
          select: 'details emailCoverageList connection ',
        })
        .select({ accounts: 1, SchemaConfig: 1 })
        .session(session)
        .exec();

      if (!profile) {
        await session.endSession();
        return { success: false, error: 'Profile not found for the given account' };
      }

      await session.commitTransaction();
      session.endSession();
      return { success: true, data: profile };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  public async findRelevantAttachmentForAccount(
    account: { connection: { userName: string }; emailCoverageList: { partialFileName: string } },
    mail: ParsedMail,
  ) {
    if (!mail.attachments || mail.attachments.length === 0) {
      console.log('Email has no attachments, skipping.');
      return null;
    }

    const emailSubject = mail.subject?.toLowerCase() || '';
    const emailText = mail.text?.toLowerCase() || '';
    const username = account.connection.userName.toLowerCase();

    if (!(emailSubject.includes(username) || emailText.includes(username))) {
      console.log('No relevant account information found in the email subject or body.');
      return null;
    }

    let relevantAttachment = mail.attachments.find(attachment => {
      const isRelevantFormat = [FileFormat.CSV, FileFormat.XLS, FileFormat.XLSX].includes(attachment.contentType as FileFormat);
      return isRelevantFormat && attachment.filename.toLowerCase().includes(account.emailCoverageList.partialFileName.toLowerCase());
    });

    if (!relevantAttachment) {
      relevantAttachment = mail.attachments.find(attachment => {
        if ([FileFormat.XLS, FileFormat.XLSX].includes(attachment.contentType as FileFormat)) {
          const workbook = xlsx.read(attachment.content, { type: 'buffer' });
          return workbook.SheetNames.some(sheetName => sheetName.toLowerCase().includes(username));
        }
        return false;
      });
    }

    if (relevantAttachment) {
      console.log('Relevant attachment found:', relevantAttachment.filename);
      return { account, attachment: relevantAttachment };
    } else {
      console.log('No relevant attachments found.');
      return null;
    }
  }
}
