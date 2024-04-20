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
  IpVersion,
  PaymentType,
} from '@/enums/profiles.enums';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIP,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
  isBoolean,
} from 'class-validator';

import { Type } from 'class-transformer';

class ProfileDetailsDto {
  @IsString()
  @Length(1, 255)
  legalName: string;

  @IsString()
  @Length(1, 255)
  accountingReference: string;

  @IsString()
  @Length(1, 255)
  address: string;

  @IsEmail()
  alertEmail: string;

  @IsString()
  @Length(1, 255)
  accountManager: string;

  @IsEmail()
  accountManagerEmail: string;

  @IsString({ each: true })
  ratingEmails: string[];

  @IsString({ each: true })
  billingEmails: string[];

  @IsEmail()
  supportEmail: string;

  @IsString({ each: true })
  dailyReportEmails: string[];

  @IsEnum(ClassificationLevel)
  classificationLevel: ClassificationLevel;

  @IsString()
  phoneNumber: string;

  @IsString()
  timeZone: string;

  @IsBoolean()
  applyTimeZoneToInvoice: boolean;

  @IsBoolean()
  applyTimeZoneToDailyReport: boolean;

  @IsBoolean()
  applyTimeZoneToRateNotification: boolean;

  @IsEnum(Currency)
  currency: Currency;

  @IsString()
  @Length(1, 255)
  country: string;

  @IsString()
  @Length(1, 255)
  website: string;

  @IsString()
  logo: string;

  @IsString()
  vatRegistrationNumber: string;

  @IsIP(IpVersion.IPv4, { each: true })
  @IsOptional()
  clientIPAddresses?: string[];
}

class MODto {
  @IsNumber()
  credit: number;

  @IsNumber()
  creditLimit: number;

  @IsNumber()
  @IsOptional()
  alertFlexAmount?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  alertPercentage1?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  alertPercentage2?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  alertPercentage3?: number;

  @IsBoolean()
  creditLimitActive: boolean;

  @IsNumber()
  @Min(0)
  @Max(100)
  tax: number;
}

class MTDto {
  @IsNumber()
  @IsOptional()
  @Min(0)
  mtCredit = 0;

  @IsNumber()
  @IsPositive()
  mtCreditLimit: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  mtAlertPercentage1?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  mtAlertPercentage2?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  mtAlertPercentage3?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  tax = 0;
}

class InvoiceDto {
  @IsString()
  billingTerm = 'monthly';

  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @IsEnum(InvoiceTemplate)
  invoiceTemplate: InvoiceTemplate;
}

class BankDto {
  @IsString()
  bankName: string;

  @IsString()
  bankAddress: string;

  @IsString()
  IBAN: string;

  @IsString()
  swiftCode: string;

  @IsOptional()
  phoneNumber?: string;

  @IsString()
  accountNumber: string;
}

class AccountDetailsDto {
  @IsString()
  name: string;

  @IsString()
  accountProfile: string;

  @IsEnum(AccountType)
  accountType: AccountType;

  @IsEnum(BusinessType)
  businessType: BusinessType;

  @IsEnum(AccountCategory)
  accountCategory: AccountCategory;

  @IsEnum(AccountMode)
  accountMode: AccountMode;

  @IsEnum(AccountStatus)
  accountStatus: AccountStatus;

  @IsString()
  timeZone: string;

  @IsBoolean()
  applyTimeZoneToInvoice: boolean;

  @IsBoolean()
  applyTimeZoneToDailyReport: boolean;

  @IsBoolean()
  applyTimeZoneToRateNotification: boolean;

  @IsEnum(Currency)
  currency: Currency;
}

class ConnectionDetailsDto {
  @IsString()
  userName: string;

  @IsString()
  password: string;

  @IsIP()
  @IsOptional()
  ipAddress?: string;

  @IsNumber()
  @IsOptional()
  port?: number;

  @IsNumber()
  @IsOptional()
  sourceTon? = 0;

  @IsNumber()
  @IsOptional()
  sourceNpi? = 0;

  @IsNumber()
  @IsOptional()
  destTon? = 0;

  @IsNumber()
  @IsOptional()
  destNpi? = 0;

  @IsNumber()
  @IsOptional()
  maximumConnections? = 5;

  @IsNumber()
  @IsOptional()
  connectionToOpen? = 1;

  @IsNumber()
  @IsOptional()
  windowSize? = 10;

  @IsNumber()
  @IsOptional()
  enquireLink? = 60;

  @IsNumber()
  @IsOptional()
  submitPerSecond? = 50;

  @IsNumber()
  @IsOptional()
  clientSubmitPerSecond? = 20;

  @IsNumber()
  @IsOptional()
  queueToSend? = 20;

  @IsEnum(ConnectionMode)
  @IsOptional()
  connectionMode?: ConnectionMode = ConnectionMode.Transceiver;

  @IsString()
  @Length(3, 5)
  translationPrefix: string;
}

class EmailCoveragelistDetailsDto {
  @IsEmail()
  email: string;

  @IsEnum(FileFormat)
  fileFormat: FileFormat;

  @IsString()
  partialFileName: string;

  @IsBoolean()
  deleteAllExisting: boolean;
}

class PriceListDetailsDto {
  @IsString()
  customId: string;

  @IsString()
  country: string;

  @IsString()
  MCC: string;

  @IsString()
  MNC: string;

  @IsString()
  @IsOptional()
  oldPrice?: string;

  @IsString()
  price: string;

  @IsEnum(Currency)
  currency: Currency;
}

class AccountDto {
  @ValidateNested()
  @Type(() => AccountDetailsDto)
  details: AccountDetailsDto;

  @ValidateNested()
  @Type(() => ConnectionDetailsDto)
  connection: ConnectionDetailsDto;

  @ValidateNested()
  @Type(() => EmailCoveragelistDetailsDto)
  emailCoverageList?: EmailCoveragelistDetailsDto;

  @ValidateNested()
  @Type(() => PriceListDetailsDto)
  priceList?: PriceListDetailsDto[];
}

class FieldsDto {
  @IsArray()
  @IsString({ each: true })
  country: string[];

  @IsArray()
  @IsString({ each: true })
  MCC: string[];

  @IsArray()
  @IsString({ each: true })
  MNC: string[];

  @IsArray()
  @IsString({ each: true })
  price: string[];

  @IsArray()
  @IsString({ each: true })
  currency: string[];
}

class SchemaConfigDto {
  @IsNumber()
  @Min(1)
  headerRow: number;

  @ValidateNested()
  @Type(() => FieldsDto)
  fields: FieldsDto;
}

export class ProfileDto {
  @ValidateNested()
  @Type(() => SchemaConfigDto)
  SchemaConfig: SchemaConfigDto;

  @ValidateNested()
  @Type(() => ProfileDetailsDto)
  ProfileDetails: ProfileDetailsDto;

  @ValidateNested()
  @Type(() => MODto)
  MO: MODto;

  @ValidateNested()
  @Type(() => MTDto)
  MT: MTDto;

  @ValidateNested()
  @Type(() => InvoiceDto)
  Invoice: InvoiceDto;

  @ValidateNested()
  @Type(() => BankDto)
  Bank: BankDto;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AccountDto)
  Accounts?: AccountDto[];
}
