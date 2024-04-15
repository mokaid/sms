import { ParsedItem, SchemaConfig } from '@/interfaces/email.interface';

import { FileFormat } from '@/enums/profiles.enums';
import { HttpException } from '@/exceptions/HttpException';
import { ObjectId } from 'mongoose';
import { ParsedMail } from 'mailparser';
import { Profile } from '@/interfaces/profiles.interface';
import { ProfileDto } from '@/dtos/profiles.dto';
import { ProfileModel } from '@/models/profiles.model';
import { Service } from 'typedi';

const xlsx = require('xlsx');

@Service()
export class ProfileService {
  public async createProfile(profileData: ProfileDto): Promise<Profile> {
    const findProfile: Profile = await ProfileModel.findOne({ 'ProfileDetails.accountingReference': profileData.ProfileDetails.accountingReference });
    if (findProfile) throw new HttpException(409, `This profile already exists`);

    profileData.Accounts.forEach(account => {
      if (account.details.accountType === 'Vendor') {
        if (!account.emailCoverageList) {
          throw new HttpException(400, 'Vendors must have an email coverage list.');
        }
        if (!account.connection.ipAddress) {
          throw new HttpException(400, 'Vendors must have an IP address.');
        }
        if (account.connection.port === undefined || account.connection.port === null) {
          throw new HttpException(400, 'Vendors must have a port.');
        }
      }
    });

    const createProfileData: Profile = await ProfileModel.create({ ...profileData });

    return createProfileData;
  }

  public async findAllProfile(page: number, limit: number, orderBy: string, sort: string): Promise<{ profiles: Profile[]; totalProfiles: number }> {
    const skip = (page - 1) * limit;
    const sortDirection = sort === 'asc' ? 1 : -1;

    const profilesPromise = ProfileModel.find({}, { 'Accounts.priceList': 0 })
      .skip(skip)
      .limit(limit)
      .sort({ [orderBy]: sortDirection });

    const countPromise = ProfileModel.countDocuments();

    const [profiles, totalProfiles] = await Promise.all([profilesPromise, countPromise]);

    return { profiles, totalProfiles };
  }

  public async findProfileById(profileId: string): Promise<Profile> {
    const findProfiler: Profile = await ProfileModel.findOne({ _id: profileId }, { 'Accounts.priceList': 0 });
    if (!findProfiler) throw new HttpException(409, "Profile doesn't exist");

    return findProfiler;
  }

  public async findProfileByAccountEmail(accountEmail: string): Promise<Profile> {
    const findProfile: Profile = await ProfileModel.findOne({ 'Accounts.emailCoverageList.email': accountEmail }, { 'Accounts.priceList': 0 });

    return findProfile;
  }

  public async updateProfile(profileId: string, profileData: ProfileDto): Promise<Profile> {
    if (profileData.ProfileDetails.accountingReference) {
      const findProfile: Profile = await ProfileModel.findOne(
        {
          'ProfileDetails.accountingReference': profileData.ProfileDetails.accountingReference,
        },
        { 'Accounts.priceList': 0 },
      );
      if (findProfile && findProfile._id != profileId) throw new HttpException(409, `This profile already exists`);
    }

    profileData.Accounts.forEach(account => {
      if (account.details.accountType === 'Vendor') {
        if (!account.emailCoverageList) {
          throw new HttpException(400, 'Vendors must have an email coverage list.');
        }
        if (!account.connection.ipAddress) {
          throw new HttpException(400, 'Vendors must have an IP address.');
        }
        if (account.connection.port === undefined || account.connection.port === null) {
          throw new HttpException(400, 'Vendors must have a port.');
        }
      }
    });

    const updateProfileById: Profile = await ProfileModel.findByIdAndUpdate(profileId, { ...profileData }, { new: true });
    if (!updateProfileById) throw new HttpException(409, "Profile doesn't exist");

    return updateProfileById;
  }

  public async deleteProfile(profileId: string): Promise<Profile> {
    const deleteProfileById: Profile = await ProfileModel.findByIdAndDelete(profileId);
    if (!deleteProfileById) throw new HttpException(409, "User doesn't exist");

    return deleteProfileById;
  }

  public async updatePriceList(accountId: ObjectId, newPriceListItems) {
    const account = await ProfileModel.findOne({ 'Accounts._id': accountId });
    if (!account) {
      throw new Error('Account not found');
    }

    const accountIndex = account.Accounts.findIndex((acc: any) => acc._id.equals(accountId));
    if (accountIndex === -1) {
      throw new Error("Account not found in profile's accounts");
    }

    // Initialize the price list if not present
    if (!account.Accounts[accountIndex].priceList) {
      account.Accounts[accountIndex].priceList = [];
    }

    if (account.Accounts[accountIndex].emailCoverageList.deleteAllExisting) {
      // If deleting all existing, filter and set the new items
      account.Accounts[accountIndex].priceList = newPriceListItems.filter(this.isValidPriceListItem);
    } else {
      const updatedPriceList = new Map(account.Accounts[accountIndex].priceList.map(item => [item.customId, item]));

      newPriceListItems.forEach(newItem => {
        if (!this.isValidPriceListItem(newItem)) return;

        const customId = `${newItem.MCC}${newItem.MNC}_${account._id}`;
        const existingItem = updatedPriceList.get(customId);

        if (existingItem) {
          if (existingItem.price !== newItem.price) {
            updatedPriceList.set(customId, {
              ...existingItem,
              oldPrice: existingItem.price,
              price: newItem.price,
              country: newItem.country,
              MCC: newItem.MCC,
              MNC: newItem.MNC,
              customId: customId,
            });
          }
        } else {
          updatedPriceList.set(customId, newItem);
        }
      });

      account.Accounts[accountIndex].priceList = Array.from(updatedPriceList.values());
    }

    await account.save();
  }

  private isValidPriceListItem(item: { country: string; MCC: string; price: string }) {
    return item.country && item.MCC && item.price;
  }

  public async findRelevantAccountAndAttachment(profile: Profile, mail: ParsedMail) {
    if (!mail.attachments || mail.attachments.length === 0) {
      console.log('Email has no attachments, skipping.');
      return null;
    }

    let foundAccount = null;
    let relevantAttachment = null;

    const emailSubject = mail.subject?.toLowerCase() || '';
    const emailText = mail.text?.toLowerCase() || '';

    foundAccount = profile.Accounts.find(account => {
      const username = account.connection.userName.toLowerCase();
      return emailSubject.toLowerCase().includes(username) || emailText.toLowerCase().includes(username);
    });

    if (foundAccount) {
      relevantAttachment = mail.attachments.find(attachment => {
        const isRelevantFormat = [FileFormat.CSV, FileFormat.XLS, FileFormat.XLSX].includes(attachment.contentType as FileFormat);
        return isRelevantFormat && attachment.filename.toLowerCase().includes(foundAccount.emailCoverageList.partialFileName.toLowerCase());
      });

      if (!relevantAttachment) {
        relevantAttachment = mail.attachments.find(attachment => {
          if ([FileFormat.XLS, FileFormat.XLSX].includes(attachment.contentType as FileFormat)) {
            const workbook = xlsx.read(attachment.content, { type: 'buffer' });
            return workbook.SheetNames.some(sheetName => sheetName.toLowerCase().includes(foundAccount.connection.userName.toLowerCase()));
          }
          return false;
        });
      }
    }

    if (!foundAccount) {
      mail.attachments.forEach(attachment => {
        if (!foundAccount && [FileFormat.CSV, FileFormat.XLS, FileFormat.XLSX].includes(attachment.contentType as FileFormat)) {
          foundAccount = profile.Accounts.find(account => {
            const username = account.connection.userName.toLowerCase();
            const matchesFilename = attachment.filename.toLowerCase().includes(username);
            let matchesSheetName = false;
            if ([FileFormat.XLS, FileFormat.XLSX].includes(attachment.contentType as FileFormat)) {
              const workbook = xlsx.read(attachment.content, { type: 'buffer' });
              matchesSheetName = workbook.SheetNames.some(sheetName => sheetName.toLowerCase().includes(username));
            }
            return matchesFilename || matchesSheetName;
          });
          if (foundAccount) {
            relevantAttachment = attachment;
          }
        }
      });
    }

    if (foundAccount && relevantAttachment) {
      return { account: foundAccount, attachment: relevantAttachment };
    } else {
      return null;
    }
  }

  public parseCsvWithSchema(content: Buffer, schemaConfig: SchemaConfig): ParsedItem[] {
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
}
