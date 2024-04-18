import {
  AccountCategory,
  AccountMode,
  AccountStatus,
  AccountType,
  BusinessType,
  ClassificationLevel,
  ConnectionMode,
  Currency,
  FileFormat,
  InvoiceTemplate,
  PaymentType,
} from '@/enums/profiles.enums';
import { Severity, getModelForClass, index, modelOptions, post, pre, prop } from '@typegoose/typegoose';

import _ from 'lodash';

class FieldConfig {
  @prop({ required: true })
  public headerRow: number;

  @prop({ required: true })
  public fields: {
    country: string[];
    MCC: string[];
    MNC: string[];
    price: string[];
    currency: string[];
  };
}

@pre<Profile>('save', function (next) {
  if (this.isNew) {
    console.log('New Profile Added:', JSON.stringify(this));
  } else {
    console.log('Profile Updated:', JSON.stringify(this));
  }
  next();
})
// Adding Post Save Hook for deeper changes comparison
@post<Profile>('save', function (doc) {
  const changedFields = _.keys(doc.modifiedPaths());
  const changes = _.pick(doc.toObject(), changedFields);
  console.log(`Post Save - Changed Fields in Profile: ${JSON.stringify(changes)}`);
})
// Adding Pre Remove Hook for logging
@pre<Profile>('remove', function (next) {
  console.log('Removing Profile:', JSON.stringify(this));
  next();
})
// Adding Post Remove Hook for logging
@post<Profile>('remove', function (doc) {
  console.log('Profile Removed:', JSON.stringify(doc));
})
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

  @prop({ type: () => [String], required: false })
  public clientIPAddress: string[];
}

class MO {
  @prop({ type: Number, required: true })
  credit: number;

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

class AccountDetails {
  @prop({ type: String, required: true })
  public name: string;

  @prop({ type: String, required: true })
  public accountProfile: string;

  @prop({ type: String, required: true, enum: AccountType })
  public accountType: AccountType;

  @prop({ type: String, required: true, enum: BusinessType })
  public businessType: BusinessType;

  @prop({ type: String, required: true, enum: AccountCategory })
  public accountCategory: AccountCategory;

  @prop({ type: String, required: true, enum: AccountMode })
  public accountMode: AccountMode;

  @prop({ type: String, required: true, enum: AccountStatus })
  public accountStatus: AccountStatus;

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
}

class ConnectionDetails {
  @prop({ type: String, required: true, unique: true, index: true })
  public userName: string;

  @prop({ type: String, required: true })
  public password: string;

  @prop({ type: String, required: false })
  public ipAddress: string;

  @prop({ type: Number, required: false })
  public port: number;

  @prop({ type: Number, required: false, default: 0 })
  public sourceTon?: number;

  @prop({ type: Number, required: false, default: 0 })
  public sourceNpi?: number;

  @prop({ type: Number, required: false, default: 0 })
  public destTon?: number;

  @prop({ type: Number, required: false, default: 0 })
  public destNpi?: number;

  @prop({ type: Number, required: false, default: 5 })
  public maximumConnections?: number;

  @prop({ type: Number, required: false, default: 1 })
  public connectionToOpen?: number;

  @prop({ type: Number, required: false, default: 10 })
  public windowSize?: number;

  @prop({ type: Number, required: false, default: 60 })
  public enquireLink?: number;

  @prop({ type: Number, required: false, default: 50 })
  public submitPerSecond?: number;

  @prop({ type: Number, required: false, default: 20 })
  public clientSubmitPerSecond?: number;

  @prop({ type: Number, required: false, default: 20 })
  public queueToSend?: number;

  @prop({ type: String, enum: ConnectionMode, required: false, default: ConnectionMode.Transceiver })
  public connectionMode?: ConnectionMode;

  @prop({ type: String, required: true, minlength: 3, maxlength: 5 })
  public translationPrefix: string;
}

class EmailCoveragelistDetails {
  @prop({ type: String, required: true })
  public email: string;

  @prop({ type: String, required: true, enum: FileFormat })
  public fileFormat: FileFormat;

  @prop({ type: String, required: true })
  public partialFileName: AccountType;

  @prop({ type: Boolean, default: false })
  deleteAllExisting: boolean;
}

class PriceListItem {
  @prop({ required: true, index: true, unique: true, sparse: true })
  public customId: string;

  @prop({ required: true })
  public country: string;

  @prop({ required: true })
  public MCC: string;

  @prop({ required: true })
  public MNC: string;

  @prop({ required: false })
  public oldPrice?: string;

  @prop({ required: true })
  public price: string;

  @prop({ type: String, required: true, enum: Currency, default: Currency.EUR })
  public currency: Currency;
}

class Account {
  @prop({ type: AccountDetails, _id: false, required: true })
  public details: AccountDetails;

  @prop({ type: ConnectionDetails, _id: false, required: true })
  public connection: ConnectionDetails;

  @prop({ type: EmailCoveragelistDetails, _id: false, required: false })
  public emailCoverageList?: EmailCoveragelistDetails;

  @prop({ type: () => [PriceListItem], _id: false, required: false })
  public priceList: PriceListItem[];
}

@modelOptions({ options: { allowMixed: Severity.ALLOW }, schemaOptions: { collection: 'profiles', timestamps: true } })
class Profile {
  @prop({ type: ProfileDetails, _id: false, required: true })
  public ProfileDetails: ProfileDetails;

  @prop({ type: MO, _id: false, required: true })
  public MO: MO;

  @prop({ type: MT, _id: false, required: true })
  public MT: MT;

  @prop({ type: Invoice, _id: false, required: true })
  public Invoice: Invoice;

  @prop({ type: Bank, _id: false, required: true })
  public Bank: Bank;

  @prop({ type: () => [Account], _id: true, required: true })
  public Accounts: Account[];

  @prop({ type: () => FieldConfig, _id: false, required: true })
  public SchemaConfig: FieldConfig;

  public createdAt?: Date;
  public updatedAt?: Date;
}

export const ProfileModel = getModelForClass(Profile);
