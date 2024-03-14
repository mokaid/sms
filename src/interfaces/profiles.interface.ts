import { ClassificationLevel, Currency, InvoiceTemplate, PaymentType } from '@/enums/profiles.enums';

export interface Profile {
  profileDetails: {
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
  };
  MO: {
    credit: number;
    creditLimit: number;
    alertFlexAmount?: number;
    alertPercentage1?: number;
    alertPercentage2?: number;
    alertPercentage3?: number;
    creditLimitActive: boolean;
    tax: number;
  };
  MT: {
    mtCredit: number;
    mtCreditLimit: number;
    mtAlertPercentage1?: number;
    mtAlertPercentage2?: number;
    mtAlertPercentage3?: number;
    tax: number;
  };
  Invoice: {
    paymentTerm: string;
    billingTerm: string;
    paymentType: PaymentType;
    invoiceTemplate: InvoiceTemplate;
  };
  Bank: {
    bankName: string;
    bankAddress: string;
    IBAN: string;
    swiftCode: string;
    phoneNumber?: string;
    accountNumber: string;
  };
}
