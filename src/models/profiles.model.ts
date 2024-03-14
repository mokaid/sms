import { ClassificationLevel, Currency, InvoiceTemplate, PaymentType } from '@/enums/profiles.enums';
import { Severity, getModelForClass, modelOptions, prop } from '@typegoose/typegoose';

class ProfileDetails {
  @prop({ type: String, required: true, maxlength: 255 })
  public legalName: string;

  @prop({ type: String, unique: true, required: true, maxlength: 255 })
  public accountingReference: string;

  @prop({ type: String, required: true, maxlength: 255 })
  public address: string;

  @prop({ type: String, required: true })
  public alertEmail: string;

  @prop({ type: String, required: true, maxlength: 255 })
  public accountManager: string;

  @prop({ type: String, required: true })
  public accountManagerEmail: string;

  @prop({ type: () => [String], required: true })
  public ratingEmails: string[];

  @prop({ type: () => [String], required: true })
  public billingEmails: string[];

  @prop({ type: String, required: true })
  public supportEmail: string;

  @prop({ type: () => [String], required: true })
  public dailyReportEmails: string[];

  @prop({ type: String, required: true, enum: ClassificationLevel })
  public classificationLevel: ClassificationLevel;

  @prop({ type: String, required: true })
  public phoneNumber: string;

  @prop({ type: String, required: true })
  public timeZone: string;

  @prop({ type: Boolean, required: true })
  public applyTimeZoneToInvoice: boolean;

  @prop({ type: Boolean, required: true })
  public applyTimeZoneToDailyReport: boolean;

  @prop({ type: Boolean, required: true })
  public applyTimeZoneToRateNotification: boolean;

  @prop({ type: String, required: true, enum: Currency })
  public currency: Currency;

  @prop({ type: String, required: true, maxlength: 255 })
  public country: string;

  @prop({ type: String, required: true, maxlength: 255 })
  public website: string;

  @prop({ type: String, required: true })
  public logo: string;

  @prop({ type: String, required: true })
  public vatRegistrationNumber: string;
}

class MO {
  @prop({ type: Number, required: true })
  credit: Number;

  @prop({ type: Number, default: -1000 })
  creditLimit: number;

  @prop({ type: Number, required: false })
  alertFlexAmount: number;

  @prop({ type: Number, required: false })
  alertPercentage1: number;

  @prop({ type: Number, required: false })
  alertPercentage2: number;

  @prop({ type: Number, required: false })
  alertPercentage3: number;

  @prop({ type: Boolean, default: false })
  creditLimitActive: boolean;

  @prop({ type: Number, default: 0 })
  tax: number;
}

class MT {
  @prop({ type: Number, default: 0 })
  public mtCredit: number;

  @prop({ type: Number, required: true })
  public mtCreditLimit: number;

  @prop({ type: Number, required: false })
  public mtAlertPercentage1?: number;

  @prop({ type: Number, required: false })
  public mtAlertPercentage2?: number;

  @prop({ type: Number, required: false })
  public mtAlertPercentage3?: number;

  @prop({ type: Number, default: 0 })
  public tax: number;
}

class Invoice {
  @prop({ type: String, required: true })
  public paymentTerm: string;

  @prop({ type: String, default: 'monthly' })
  public billingTerm: string;

  @prop({ type: String, enum: PaymentType, required: true })
  public paymentType: PaymentType;

  @prop({ type: String, enum: InvoiceTemplate, required: true })
  public invoiceTemplate: InvoiceTemplate;
}

class Bank {
  @prop({ type: String, required: true })
  public bankName: string;

  @prop({ type: String, required: true })
  public bankAddress: string;

  @prop({ type: String, required: true })
  public IBAN: string;

  @prop({ type: String, required: true })
  public swiftCode: string;

  @prop({ type: String, required: false })
  public phoneNumber?: string;

  @prop({ type: String, required: true })
  public accountNumber: string;
}

@modelOptions({ options: { allowMixed: Severity.ALLOW }, schemaOptions: { collection: 'profiles', timestamps: true } })
class Profile {
  @prop({ type: ProfileDetails, _id: false, required: true })
  public profileDetails: ProfileDetails;

  @prop({ type: MO, _id: false, required: true })
  public MO: MO;

  @prop({ type: MT, _id: false, required: true })
  public MT: MT;

  @prop({ type: Invoice, _id: false, required: true })
  public Invoice: Invoice;

  @prop({ type: Bank, _id: false, required: true })
  public Bank: Bank;

  public createdAt?: Date;
  public updatedAt?: Date;
}

export const ProfileModel = getModelForClass(Profile);
