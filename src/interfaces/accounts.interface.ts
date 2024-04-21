import { AccountCategory, AccountMode, AccountStatus, AccountType, BusinessType, ConnectionMode, FileFormat } from '@/enums/accounts.enums';

import { Currency } from '@/enums/common.enums';
import { IPriceListDetails } from './prices.interface';

// Interface for Account
export interface IAccount {
  details: IAccountDetails;
  connection: IConnectionDetails;
  emailCoverageList?: IEmailCoveragelistDetails;
  priceList?: IPriceListDetails[];
}

// Interface for Connection Details
export interface IConnectionDetails {
  userName: string;
  password: string;
  ipAddress?: string;
  port?: number;
  sourceTon?: number;
  sourceNpi?: number;
  destTon?: number;
  destNpi?: number;
  maximumConnections?: number;
  connectionToOpen?: number;
  windowSize?: number;
  enquireLink?: number;
  submitPerSecond?: number;
  clientSubmitPerSecond?: number;
  queueToSend?: number;
  connectionMode?: ConnectionMode;
  translationPrefix: string;
}

// Interface for Account Details
export interface IAccountDetails {
  name: string;
  accountProfile: string;
  accountType: AccountType;
  businessType: BusinessType;
  accountCategory: AccountCategory;
  accountMode: AccountMode;
  accountStatus: AccountStatus;
  timeZone: string;
  applyTimeZoneToInvoice: boolean;
  applyTimeZoneToDailyReport: boolean;
  applyTimeZoneToRateNotification: boolean;
  currency: Currency;
}

// Interface for Email Coverage List Details
export interface IEmailCoveragelistDetails {
  email: string;
  fileFormat: FileFormat;
  partialFileName: string;
  deleteAllExisting: boolean;
}
