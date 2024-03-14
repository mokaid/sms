import { ClassificationLevel, Currency } from '@/enums/profiles.enums';
import { IsBoolean, IsEmail, IsEnum, IsInt, IsOptional, IsString, Length, ValidateNested } from 'class-validator';

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
  @IsString()
  credit: string;
}

export class ProfileDto {
  @ValidateNested()
  @Type(() => ProfileDetailsDto)
  profileDetails: ProfileDetailsDto;

  @ValidateNested()
  @Type(() => MODto)
  MO: MODto;
}
