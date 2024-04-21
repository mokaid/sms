import { ClassificationLevel, InvoiceTemplate, PaymentType } from '@/enums/profiles.enums';

import { Currency } from '@/enums/common.enums';
import { IAccount } from './accounts.interface';

// Interface for Profile Details
export interface IProfileDetails {
  legalName: string;
  accountingReference: string;
  address: string;
  alertEmail: string;
  accountManager: string;
  accountManagerEmail: string;
  ratingEmails: string[];
  billingEmails: string[];
  supportEmail: string;
  dailyReportEmails: string[];
  classificationLevel: ClassificationLevel;
  phoneNumber: string;
  timeZone: string;
  applyTimeZoneToInvoice: boolean;
  applyTimeZoneToDailyReport: boolean;
  applyTimeZoneToRateNotification: boolean;
  currency: Currency;
  country: string;
  website: string;
  logo: string;
  vatRegistrationNumber: string;
  clientIPAddresses?: string[];
}

// Interface for Monetary Operations (MO)
export interface IMO {
  credit: number;
  creditLimit: number;
  alertFlexAmount?: number;
  alertPercentage1?: number;
  alertPercentage2?: number;
  alertPercentage3?: number;
  creditLimitActive: boolean;
  tax: number;
}

// Interface for Monetary Terms (MT)
export interface IMT {
  mtCredit?: number;
  mtCreditLimit: number;
  mtAlertPercentage1?: number;
  mtAlertPercentage2?: number;
  mtAlertPercentage3?: number;
  tax: number;
}

// Interface for Invoice Details
export interface IInvoice {
  paymentTerm: string;
  billingTerm: string;
  paymentType: PaymentType;
  invoiceTemplate: InvoiceTemplate;
}

// Interface for Bank Details
export interface IBank {
  bankName: string;
  bankAddress: string;
  IBAN: string;
  swiftCode: string;
  phoneNumber?: string;
  accountNumber: string;
}

interface ISchemaConfig {
  headerRow: number;
  fields: {
    country: string[];
    MCC: string[];
    MNC: string[];
    price: string[];
    currency: string[];
  };
}

// Main Profile Interface
export interface IProfile {
  ProfileDetails: IProfileDetails;
  MO: IMO;
  MT: IMT;
  Invoice: IInvoice;
  Bank: IBank;
  SchemaConfig: ISchemaConfig;
  Accounts?: IAccount[];
}
