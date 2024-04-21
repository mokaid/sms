import { AccountCategory, AccountMode, AccountStatus, AccountType, BusinessType, ConnectionMode, FileFormat } from '@/enums/accounts.enums';
import { IsBoolean, IsEmail, IsEnum, IsIP, IsNumber, IsOptional, IsString, Length, ValidateNested } from 'class-validator';

import { Currency } from '@/enums/common.enums';
import { ObjectId } from 'mongoose';
import { PriceListDetailsDto } from './prices.dto';
import { Type } from 'class-transformer';

class ConnectionDetailsDto {
  @IsString() userName: string;
  @IsString() password: string;
  @IsOptional() @IsIP() ipAddress?: string;
  @IsOptional() @IsNumber() port?: number;
  @IsOptional() @IsNumber() sourceTon? = 0;
  @IsOptional() @IsNumber() sourceNpi? = 0;
  @IsOptional() @IsNumber() destTon? = 0;
  @IsOptional() @IsNumber() destNpi? = 0;
  @IsOptional() @IsNumber() maximumConnections? = 5;
  @IsOptional() @IsNumber() connectionToOpen? = 1;
  @IsOptional() @IsNumber() windowSize? = 10;
  @IsOptional() @IsNumber() enquireLink? = 60;
  @IsOptional() @IsNumber() submitPerSecond? = 50;
  @IsOptional() @IsNumber() clientSubmitPerSecond? = 20;
  @IsOptional() @IsNumber() queueToSend? = 20;
  @IsOptional() @IsEnum(ConnectionMode) connectionMode?: ConnectionMode = ConnectionMode.Transceiver;
  @IsString() @Length(3, 5) translationPrefix: string;
}

class AccountDetailsDto {
  @IsString() name: string;
  @IsString() accountProfile: string;
  @IsEnum(AccountType) accountType: AccountType;
  @IsEnum(BusinessType) businessType: BusinessType;
  @IsEnum(AccountCategory) accountCategory: AccountCategory;
  @IsEnum(AccountMode) accountMode: AccountMode;
  @IsEnum(AccountStatus) accountStatus: AccountStatus;
  @IsString() timeZone: string;
  @IsBoolean() applyTimeZoneToInvoice: boolean;
  @IsBoolean() applyTimeZoneToDailyReport: boolean;
  @IsBoolean() applyTimeZoneToRateNotification: boolean;
  @IsEnum(Currency) currency: Currency;
}

class EmailCoveragelistDetailsDto {
  @IsEmail() email: string;
  @IsEnum(FileFormat) fileFormat: FileFormat;
  @IsString() partialFileName: string;
  @IsBoolean() deleteAllExisting: boolean;
}

export class AccountDto {
  @IsOptional() @IsString() _id: string;
  @ValidateNested() @Type(() => AccountDetailsDto) details: AccountDetailsDto;
  @ValidateNested() @Type(() => ConnectionDetailsDto) connection: ConnectionDetailsDto;
  @ValidateNested() @Type(() => EmailCoveragelistDetailsDto) emailCoverageList?: EmailCoveragelistDetailsDto;
  @ValidateNested() @Type(() => PriceListDetailsDto) priceList?: PriceListDetailsDto[];
}
