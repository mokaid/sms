import 'reflect-metadata';

import Container, { Service } from 'typedi';
import { ParsedItem, SchemaConfig } from '@/interfaces/email.interface';
import mongoose, { Model } from 'mongoose';

import { Account } from '@/models/accounts.model';
import { AccountDto } from '@/dtos/accounts.dto';
import { FileFormat } from '@/enums/accounts.enums';
import { HttpException } from '@/exceptions/HttpException';
import { ObjectId } from 'mongodb';
import { Operator } from '@/models/operators.model';
import { ParsedMail } from 'mailparser';
import { PriceListItem } from '@/models/prices.model';
import { Profile } from '@/models/profiles.model';
import xlsx from 'xlsx';

@Service()
export class ProfileService {
  private profileModel: Model<Profile>;
  private accountModel: Model<Account>;
  private priceListItemModel: Model<PriceListItem>;
  private operatorModel: Model<Operator>;

  constructor() {
    this.profileModel = Container.get<Model<Profile>>('ProfileModel');
    this.accountModel = Container.get<Model<Account>>('AccountModel');
    this.priceListItemModel = Container.get<Model<PriceListItem>>('PriceListItemModel');
    this.operatorModel = Container.get<Model<Operator>>('OperatorsModel');
  }

  public async createProfile(profileData: { ProfileDetails: { accountingReference: string }; Accounts: AccountDto[] }): Promise<Profile> {
    const session = await this.profileModel.db.startSession();
    session.startTransaction();
    try {
      const existingProfile = await this.profileModel
        .findOne(
          {
            'ProfileDetails.accountingReference': profileData.ProfileDetails.accountingReference,
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
  
    const query = this.profileModel
      .find(searchQuery)
      .populate({
        path: 'accounts',
        select: { priceList: 0 },
        // populate: {
        //   path: 'priceList',
        //   model: 'PriceListItem', // Ensure this is the correct name of your price list model
        // },
      })
      .skip(skip)
      .sort({ [orderBy]: sortDirection });
  
    // Only apply the limit if it is not -1
    if (limit !== -1) {
      query.limit(limit);
    }
  
    const profilesPromise = query.exec().then((profiles:any) =>
      profiles.map(profile => {
        profile = profile.toObject();
        profile.Accounts = profile.accounts;
        delete profile.accounts;
        return profile;
      }),
    );
  
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
      .exec()
      .then((profile:any) => {
        if (profile) {
          profile = profile.toObject();
          profile.Accounts = profile.accounts;
          delete profile.accounts;
        }
        return profile;
      });

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
      const deletedPriceLists = await this.priceListItemModel.find({ account: { $in: accountIds } }, '_id operator', { session }).exec();

      await this.accountModel.deleteMany({ _id: { $in: accountIds } }, { session });
      await this.priceListItemModel.deleteMany({ account: { $in: accountIds } }, { session });

      const operatorIdsToUpdate = deletedPriceLists.filter(priceList => priceList.operator).map(priceList => priceList.operator);

      if (operatorIdsToUpdate.length > 0) {
        const updatePromises = operatorIdsToUpdate.map((operatorId: any) => {
          return this.operatorModel.updateOne(
            { _id: new ObjectId(operatorId) },
            { $pull: { priceList: { $in: deletedPriceLists.map(pl => new ObjectId(pl._id.toString())) } } },
            { session },
          );
        });

        await Promise.all(updatePromises);
      }

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
      const deletedPriceLists = await this.priceListItemModel.find({ account: { $in: accountsToRemove } }, '_id operator', { session }).exec();

      await this.accountModel.deleteMany({ _id: { $in: accountsToRemove } }, { session });
      await this.profileModel.findByIdAndUpdate(profileId, { $set: { accounts: updatedAccounts } }, { session });
      await this.priceListItemModel.deleteMany({ account: { $in: accountsToRemove } }, { session });

      const operatorIdsToUpdate = deletedPriceLists.filter(priceList => priceList.operator).map(priceList => priceList.operator);

      if (operatorIdsToUpdate.length > 0) {
        const updatePromises = operatorIdsToUpdate.map((operatorId: any) => {
          return this.operatorModel.updateOne(
            { _id: new ObjectId(operatorId) },
            { $pull: { priceList: { $in: deletedPriceLists.map(pl => new ObjectId(pl._id.toString())) } } },
            { session },
          );
        });

        await Promise.all(updatePromises);
      }

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

  public parseCsvWithSchema(content: Buffer | unknown[], schemaConfig: SchemaConfig) {
    const lines: string[] = content
      .toString('utf8')
      .split('\n')
      .filter(line => line.trim() !== '');
    const headers: string[] = this.parseCsvLine(lines[schemaConfig.headerRow - 1]);

    const columnIndexMap: { [key: string]: number } = {};
    Object.entries(schemaConfig.fields).forEach(([fieldName, possibleHeaders]) => {
      columnIndexMap[fieldName] = headers.findIndex(header => possibleHeaders.includes(header));
    });

    return lines.slice(schemaConfig.headerRow).map(line => {
      const data = this.parseCsvLine(line);
      const obj: Partial<ParsedItem> = {};
      Object.entries(columnIndexMap).forEach(([fieldName, index]) => {
        if (index >= 0) {
          obj[fieldName as keyof ParsedItem] = data[index];
        }
      });

      if (!obj.currency) obj.currency = 'EUR';

      return obj;
    });
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    if (current !== '') {
      result.push(current.trim());
    }

    return result;
  }

  public async updatePriceList(accountId: string, newPriceListItems: any[], deleteAllExisting: boolean): Promise<void> {
    const maxRetries = 5; // Maximum number of retries
    let attempt = 0; // Current attempt number
  
    while (attempt < maxRetries) {
      const session = await this.operatorModel.db.startSession();
      try {
        session.startTransaction();
        const accountObjectId = new mongoose.Types.ObjectId(accountId);
  
        // Fetch operators and create a map of them by MCC_MNC for quick lookup
        const operators = await this.operatorModel.find({ active: 'True' }).session(session);
        const operatorMap = new Map(operators.map(op => [op.MCC + '_' + op.MNC, op]));
        const defaultOperator = operatorMap.get('000_000');
  
        if (deleteAllExisting) {
          const existingItems = await this.priceListItemModel.find({ account: accountObjectId }, '_id operator').session(session);
          const operatorUpdates = existingItems.map(item =>
            this.operatorModel.findByIdAndUpdate(item.operator, { $pull: { priceList: item._id } }, { session: session }),
          );
  
          await Promise.all(operatorUpdates);
          await this.priceListItemModel.deleteMany({ account: accountObjectId }, { session: session });
          await this.accountModel.findByIdAndUpdate(accountId, { $set: { priceList: [] } }, { session: session });
  
          const newItems = newPriceListItems.map(item => {
            const operatorKey = item.MCC + '_' + item.MNC;
            return {
              ...item,
              account: accountObjectId,
              operator: operatorMap.get(operatorKey) || defaultOperator,
            };
          });
  
          const insertedItems = await this.priceListItemModel.insertMany(newItems, { session: session });
          const newItemIds = insertedItems.map(item => item._id);
  
          for (const item of insertedItems) {
            if (item.operator) {
              await this.operatorModel.findByIdAndUpdate(item.operator, { $addToSet: { priceList: item._id } }, { session: session });
            }
          }
  
          await this.accountModel.findByIdAndUpdate(accountId, { $push: { priceList: { $each: newItemIds } } }, { session: session });
        } else {
          const currentPrices = await this.priceListItemModel.find({ account: accountObjectId }).session(session);
          const priceMap = new Map(currentPrices.map((item: any) => [item.MCC + '_' + item.MNC, item]));
  
          const newItems = [];
          const updatedItems = [];
  
          for (const item of newPriceListItems) {
            const key = item.MCC + '_' + item.MNC;
            const existingPrice = priceMap.get(key);
            const operator = operatorMap.get(key) || defaultOperator;
  
            if (existingPrice && existingPrice.price !== item.price) {
              existingPrice.oldPrice = existingPrice.price;
              existingPrice.price = item.price;
              updatedItems.push(existingPrice.save({ session: session }));
            } else if (!existingPrice) {
              newItems.push({
                ...item,
                account: accountObjectId,
                operator: operator ? operator._id : undefined,
              });
            }
          }
  
          if (newItems.length > 0) {
            const insertedItems = await this.priceListItemModel.insertMany(newItems, { session: session });
            const newItemIds = insertedItems.map(item => item._id);
  
            await this.accountModel.findByIdAndUpdate(accountId, { $push: { priceList: { $each: newItemIds } } }, { session: session });
  
            for (const item of insertedItems) {
              if (item.operator) {
                await this.operatorModel.findByIdAndUpdate(item.operator, { $addToSet: { priceList: item._id } }, { session: session });
              }
            }
          }
  
          if (updatedItems.length > 0) {
            await Promise.all(updatedItems);
          }
        }
  
        await session.commitTransaction();
        console.log('Transaction committed successfully');
        session.endSession();
        break; // If commit was successful, exit the loop
      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error);
        await session.abortTransaction();
        session.endSession();
        if (!error.hasErrorLabel('TransientTransactionError') || attempt + 1 >= maxRetries) {
          throw error; // Throw if not a transient error or if max retries reached
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt))); // Wait 2^attempt seconds
      } finally {
        attempt++;
      }
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
