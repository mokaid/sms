import { ClassificationLevel, InvoiceTemplate, IpVersion, PaymentType } from '@/enums/profiles.enums';
import { IsBoolean, IsEmail, IsEnum, IsIP, IsNumber, IsOptional, IsPositive, IsString, Length, Max, Min, ValidateNested } from 'class-validator';

import { AccountDto } from './accounts.dto';
import { Currency } from '@/enums/common.enums';
import { Type } from 'class-transformer';

class ProfileDetailsDto {
  @IsString() @Length(1, 255) legalName: string;
  @IsString() @Length(1, 255) accountingReference: string;
  @IsString() @Length(1, 255) address: string;
  @IsEmail() alertEmail: string;
  @IsString() @Length(1, 255) accountManager: string;
  @IsEmail() accountManagerEmail: string;
  @IsString({ each: true }) ratingEmails: string[];
  @IsString({ each: true }) billingEmails: string[];
  @IsEmail() supportEmail: string;
  @IsString({ each: true }) dailyReportEmails: string[];
  @IsEnum(ClassificationLevel) classificationLevel: ClassificationLevel;
  @IsString() phoneNumber: string;
  @IsString() timeZone: string;
  @IsBoolean() applyTimeZoneToInvoice: boolean;
  @IsBoolean() applyTimeZoneToDailyReport: boolean;
  @IsBoolean() applyTimeZoneToRateNotification: boolean;
  @IsEnum(Currency) currency: Currency;
  @IsString() @Length(1, 255) country: string;
  @IsString() @Length(1, 255) website: string;
  @IsString() logo: string;
  @IsString() vatRegistrationNumber: string;
  @IsIP(IpVersion.IPv4, { each: true }) @IsOptional() clientIPAddresses?: string[];
}

class MODto {
  @IsNumber() credit: number;
  @IsNumber() creditLimit: number;
  @IsOptional() @IsNumber() alertFlexAmount?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) alertPercentage1?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) alertPercentage2?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) alertPercentage3?: number;
  @IsBoolean() creditLimitActive: boolean;
  @IsNumber() @Min(0) @Max(100) tax: number;
}

class MTDto {
  @IsOptional() @IsNumber() @Min(0) mtCredit = 0;
  @IsNumber() @IsPositive() mtCreditLimit: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) mtAlertPercentage1?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) mtAlertPercentage2?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) mtAlertPercentage3?: number;
  @IsNumber() @Min(0) @Max(100) tax = 0;
}

class InvoiceDto {
  @IsString() billingTerm = 'monthly';
  @IsEnum(PaymentType) paymentType: PaymentType;
  @IsEnum(InvoiceTemplate) invoiceTemplate: InvoiceTemplate;
}

class BankDto {
  @IsString() bankName: string;
  @IsString() bankAddress: string;
  @IsString() IBAN: string;
  @IsString() swiftCode: string;
  @IsOptional() @IsString() phoneNumber?: string;
  @IsString() accountNumber: string;
}

export class ProfileDto {
  @ValidateNested() @Type(() => ProfileDetailsDto) ProfileDetails: ProfileDetailsDto;
  @ValidateNested() @Type(() => MODto) MO: MODto;
  @ValidateNested() @Type(() => MTDto) MT: MTDto;
  @ValidateNested() @Type(() => InvoiceDto) Invoice: InvoiceDto;
  @ValidateNested() @Type(() => BankDto) Bank: BankDto;
  @IsOptional() @ValidateNested({ each: true }) @Type(() => AccountDto) Accounts?: AccountDto;
}
