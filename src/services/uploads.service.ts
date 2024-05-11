import * as XLSX from 'xlsx';

import Container, { Service } from 'typedi';
import { IAccount, IEmailCoveragelistDetails } from '@/interfaces/accounts.interface';

import { HttpException } from '@/exceptions/HttpException';
import { IOperators } from '@/interfaces/operators.interface';
import { OperatorsService } from './operators.service';
import { ProfileService } from './profiles.service';
import { UploadFile } from '@/interfaces/uploads.interface';
import { formatCodeWithLeadingZeros } from '@/utils/helpers';

@Service()
export class UploadsService {
  private profile: ProfileService;
  private operators: OperatorsService;

  constructor() {
    this.profile = Container.get(ProfileService);
    this.operators = Container.get(OperatorsService);
  }

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
        MCC: formatCodeWithLeadingZeros(item.MCC),
        MNC: formatCodeWithLeadingZeros(item.MNC),
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
      throw new HttpException(500, `Failed to process Excel file : ${error}`);
    }
  }

  public async processOperatorsFile(file: UploadFile, SchemaConfig) {
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      const csvContent = XLSX.utils.sheet_to_csv(worksheet, { FS: ',', RS: '\n' });

      const parsedData = this.profile.parseCsvWithSchema(Buffer.from(csvContent, 'utf8'), SchemaConfig) as IOperators[];

      const operatorsToInsert = [];

      for (const item of parsedData) {
        const mccmncCodes = this.parseMCCMNC(item.MCCMNC || '');

        for (const code of mccmncCodes) {
          const operatorData = {
            zone: item.zone,
            country: item.country,
            operator: item.operator,
            countryCode: item.countryCode,
            mobileCountryCode: item.mobileCountryCode,
            mobileNetworkCode: item.mobileNetworkCode,
            MCC: code.MCC,
            MNC: code.MNC,
            active: item.active,
          };

          operatorsToInsert.push(operatorData);
        }
      }

      console.log(operatorsToInsert);

      await this.operators
        .createOperators(operatorsToInsert as any)
        .then(() => {
          console.log('All operators created successfully.');
        })
        .catch(error => {
          console.error('Failed to bulk create operators', error);
          throw new HttpException(500, 'Failed to bulk create operators');
        });

      return parsedData;
    } catch (error) {
      console.error('Failed to process Operators file', error);
      throw new HttpException(500, 'Failed to process Operators file');
    }
  }

  private parseMCCMNC(rawMCCMNC: string) {
    return rawMCCMNC.split(',').map(code => {
      code = code.trim();

      let mcc = '';
      let mnc = '';

      if (code.length === 5) {
        mcc = code.substring(0, 3);
        mnc = code.substring(3);
      } else if (code.length === 6) {
        mcc = code.substring(0, 3);
        mnc = code.substring(3);
      } else if (code.length === 4) {
        mcc = code.substring(0, 3);
        mnc = code.substring(3);
      } else if (code.length === 3) {
        mcc = code;
        mnc = '000';
      } else if (code.length < 3) {
        mcc = code;
        mnc = '000';
      } else {
        mcc = code.slice(0, -3);
        mnc = code.slice(-3);
      }

      mnc = mnc.padStart(3, '0');
      return { MCC: mcc, MNC: mnc };
    });
  }
}
