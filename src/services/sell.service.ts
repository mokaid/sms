import Container, { Service } from 'typedi';
import { Model } from 'mongoose';
import { Sell } from '@/models/sell.model';
import { HttpException } from '@/exceptions/HttpException';
import { Account } from '@/models/accounts.model';
import { PriceListItem } from '@/models/prices.model';
import xlsx from 'xlsx';
import nodemailer from 'nodemailer';
import { Operator } from '@/models/operators.model';
import { EMAIL_PASSWORD_SELL_RATES, EMAIL_SERVICE_SELL_RATES, EMAIL_USER_SELL_RATES } from '@/config';
import { ConfigurationService } from './configurations.service';

@Service()
export class SellService {
  private sellModel: Model<Sell>;
  private operatorModel: Model<Operator>;
  private configurationService: ConfigurationService;


  constructor() {
    this.sellModel = Container.get<Model<Sell>>('SellModel');
    this.operatorModel = Container.get<Model<Operator>>('OperatorsModel');
    this.configurationService = Container.get(ConfigurationService);

  }

  public async createSell(account: Account, priceItems: PriceListItem[]) {
    const session = await this.sellModel.db.startSession();
    session.startTransaction();
    try {
      const sell = new this.sellModel({
        account,
        priceItems,
      });
      await sell.save({ session });

      await session.commitTransaction();

      await this.processSell(sell._id as any);

      return sell;
    } catch (error) {
      await session.abortTransaction();
      console.error('Error during sell creation:', error);
      throw new HttpException(500, 'Error during sell creation');
    } finally {
      session.endSession();
    }
  }

  public async findSellById(sellId: string) {
    try {
      const sell = await this.sellModel.findById(sellId).exec();
      if (!sell) {
        throw new HttpException(404, "Sell record doesn't exist");
      }
      return sell;
    } catch (error) {
      console.error('Error finding sell by ID:', error);
      throw new HttpException(500, 'Error finding sell by ID');
    }
  }

  public async findAllSells({ page = 1, limit = 10, orderBy = 'createdAt', sortOrder = 'asc', filters = {} }) {
    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const sellFilters: Record<string, any> = {};
    Object.keys(filters).forEach(key => {
      if (typeof filters[key] === 'string' && filters[key]) {
        sellFilters[key] = filters[key];
      } else if (typeof filters[key] === 'boolean') {
        sellFilters[key] = filters[key];
      }
    });

    try {
      const query = this.sellModel
        .find(sellFilters)
        .sort({ [orderBy]: sortDirection })
        .skip(skip)
        .limit(limit);

      const sells = await query.exec();
      const total = await this.sellModel.countDocuments(sellFilters);

      return {
        data: sells,
        total,
      };
    } catch (error) {
      console.error('Error finding all sells:', error);
      throw new HttpException(500, 'Error finding all sells');
    }
  }

  public async getSellDetails(sellId: string) {
    const sell = await this.sellModel.findById(sellId).populate({
      path: 'account',
      populate: { path: 'emailCoverageList connection' }
    }).populate({
      path: 'priceItems.price'
    }).exec();
    
    if (!sell) {
      throw new HttpException(404, 'Sell record not found');
    }

    const priceItems = await Promise.all(sell.priceItems.map(async (item: any) => {
      const operator = await this.operatorModel.findOne({ priceList: { $in: [item.price._id] } }).exec();
      return {
        price: item.price,
        currentPrice: item.currentPrice,
        sellPrice: item.sellPrice,
        operator: operator ? operator.operator : null,
        country: operator ? operator.country : null,
      };
    }));

    return {
      account: sell.account,
      priceItems,
    };
  }

  public generateCSV(sellDetails: { account: any, priceItems: any[] }) {
    const { account, priceItems } = sellDetails;
    const data = priceItems.map(item => ({
      MNC: item.price.MNC,
      MCC: item.price.MCC,
      Price: item.sellPrice,
      Operator: item.operator,
      Country: item.country,
    }));

    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'SellDetails');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'csv' });
    const csvData = xlsx.utils.sheet_to_csv(ws);

    return { csvBuffer: buffer, csvData: csvData };
  }

  public async sendEmailWithAttachment(account: any, csvBuffer: Buffer) {

    const config = await this.configurationService.findAllConfigurations();
    const configData = config[0]; 

    const subject = configData.sellRatesEmailSubject || 'Intellialgos Rates';
    const body = configData.sellRatesEmailBody || `Dear ${account.connection.userName},\n\nPlease find the attached CSV file with the latest Intellialgos rates.\n\nBest regards,\nIntellialgos Team`;
    const fileName = configData.sellRatesEmailFileName || 'intellialgos_rates.csv';

    const transporter = nodemailer.createTransport({
      service: EMAIL_SERVICE_SELL_RATES,
      auth: {
        user: EMAIL_USER_SELL_RATES,
        pass: EMAIL_PASSWORD_SELL_RATES,
      },
    });

    const mailOptions = {
      from: EMAIL_USER_SELL_RATES,
      to: account.emailCoverageList.email,
      subject: subject,
      text: `Dear ${account.connection.userName},${body}`,
      attachments: [
        {
          filename: fileName,
          content: csvBuffer,
        },
      ],
    };

    await transporter.sendMail(mailOptions);
  }

  public generateInvoice() {
    // Placeholder for generating invoice
  }

  public async processSell(sellId: string) {
    const session = await this.sellModel.db.startSession();
    session.startTransaction();
    try {
      const sellDetails = await this.getSellDetails(sellId);
      const { csvBuffer, csvData } = this.generateCSV(sellDetails);
      
      const sell = await this.sellModel.findById(sellId).exec();
      if (sell) {
        sell.attachmentData = csvData;
        await sell.save({ session });
      }

      await this.sendEmailWithAttachment(sellDetails.account, csvBuffer);

      this.generateInvoice();

      await session.commitTransaction();
      console.log('Sell processed successfully.');
    } catch (error) {
      await session.abortTransaction();
      console.error('Error processing sell:', error);
      throw new HttpException(500, 'Error processing sell');
    } finally {
      session.endSession();
    }
  }
}
