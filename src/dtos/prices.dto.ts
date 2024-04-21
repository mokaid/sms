import { IsEnum, IsOptional, IsString } from 'class-validator';

import { Currency } from '@/enums/common.enums';

export class PriceListDetailsDto {
  @IsOptional() @IsString() country: string;
  @IsOptional() @IsString() MCC: string;
  @IsOptional() @IsString() MNC: string;
  @IsOptional() @IsString() oldPrice?: string;
  @IsOptional() @IsString() price: string;
  @IsOptional() @IsEnum(Currency) currency: Currency;
}
