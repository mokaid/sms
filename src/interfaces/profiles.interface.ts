import { ClassificationLevel, Currency } from '@/enums/profiles.enums';

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
    credit: string;
  };
}
