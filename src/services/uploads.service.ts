import * as XLSX from 'xlsx';

import { IAccount, IEmailCoveragelistDetails } from '@/interfaces/accounts.interface';
import { Inject, Service } from 'typedi';

import { HttpException } from '@/exceptions/HttpException';
import { ProfileService } from './profiles.service';
import { UploadFile } from '@/interfaces/uploads.interface';
import { OperatorsService } from './operators.service';
import { IOperators } from '@/interfaces/operators.interface';

@Service()
export class UploadsService {
  constructor(@Inject(() => ProfileService) private profile: ProfileService, @Inject(() => OperatorsService) private operators: OperatorsService) {}

  public async processRatesFile(file: UploadFile, accountId: string) {
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      const csvContent = XLSX.utils.sheet_to_csv(worksheet, { FS: ',', RS: '\n' });

      const profile = await this.profile.findProfileByAccountID(accountId);
      if (!profile) {
        throw new HttpException(404, 'Profile not found');
      }

      const account = profile.accounts[0] as IAccount & { emailCoverageList: IEmailCoveragelistDetails };
      const { deleteAllExisting } = account.emailCoverageList;

      const parsedData = this.profile.parseCsvWithSchema(Buffer.from(csvContent, 'utf8'), profile.SchemaConfig);

      const priceListItems = parsedData.map(item => ({
        country: item.country,
        MCC: item.MCC,
        MNC: item.MNC,
        price: item.price,
        currency: item.currency,
      }));

      await this.profile
        .updatePriceList(accountId, priceListItems, deleteAllExisting)
        .then(() => {
          console.log('Price list updated successfully.');
        })
        .catch(() => {
          throw new HttpException(500, 'Failed to update price list');
        });

      return { parsedData, accountId };
    } catch (error) {
      throw new HttpException(500, 'Failed to process Excel file');
    }
  }

  public async processOperatorsFile(file: UploadFile, SchemaConfig) {
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      const csvContent = XLSX.utils.sheet_to_csv(worksheet, { FS: ',', RS: '\n' });

      const parsedData = this.profile.parseCsvWithSchema(Buffer.from(csvContent, 'utf8'), SchemaConfig);

      const operatorsListItems = parsedData.map((item: IOperators) => ({
        zone: item.zone,
        country: item.country,
        operator: item.operator,
        countryCode: item.countryCode,
        mobileCountryCode: item.mobileCountryCode,
        mobileNetworkCode: item.mobileNetworkCode,
        MCCMNC: item.MCCMNC,
        zoneId: item.zoneId,
        countryId: item.countryId,
        operatorId: item.operatorId,
        active: item.active,
      }));

      await this.operators
        .createOperators(operatorsListItems)
        .then(() => {
          console.log('Operators list updated successfully.');
        })
        .catch(() => {
          throw new HttpException(500, 'Failed to update operators list');
        });

      return parsedData;
    } catch (error) {
      throw new HttpException(500, 'Failed to process Operators file');
    }
  }
}
