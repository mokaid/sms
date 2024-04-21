import * as XLSX from 'xlsx';

import { Container, Service } from 'typedi';

import { HttpException } from '@/exceptions/HttpException';
import { ProfileService } from './profiles.service';
import { UploadFile } from '@/interfaces/uploads.interface';

@Service()
export class UploadsService {
  public profileService = Container.get(ProfileService);

  public async processExcelFile(file: UploadFile, accountId: string): Promise<{ data: any[]; accountId: string }> {
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      const csvContent = XLSX.utils.sheet_to_csv(worksheet, { FS: ',', RS: '\n' });
      console.log(accountId);

      const profile = await this.profileService.findProfileByAccountID(accountId);
      if (!profile) {
        throw new HttpException(404, 'Profile not found');
      }

      const { deleteAllExisting } = profile.accounts[0].emailCoverageList;
      const parsedData = this.profileService.parseCsvWithSchema(Buffer.from(csvContent, 'utf8'), profile.SchemaConfig);

      const priceListItems = parsedData.map(item => ({
        country: item.country,
        MCC: item.MCC,
        MNC: item.MNC,
        price: item.price,
        currency: item.currency,
      }));

      await this.profileService
        .updatePriceList(accountId, priceListItems, deleteAllExisting)
        .then(() => {
          console.log('Price list updated successfully.');
        })
        .catch(err => {
          throw new HttpException(500, 'Failed to update price list');
        });

      return { data: parsedData, accountId };
    } catch (error) {
      throw new HttpException(500, 'Failed to process Excel file');
    }
  }
}
