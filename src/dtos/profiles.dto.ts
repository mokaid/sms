import { ClassificationLevel, Currency, InvoiceTemplate, PaymentType } from '@/enums/profiles.enums';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsPositive,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
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
}

class MODto {
  @IsNumber()
  credit: number; // Assuming 'credit' should be a number, not a string

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

export class ProfileDto {
  @ValidateNested()
  @Type(() => ProfileDetailsDto)
  profileDetails: ProfileDetailsDto;

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
}
