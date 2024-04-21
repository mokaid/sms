import { IsEnum, IsOptional, IsString } from 'class-validator';

import { Currency } from '@/enums/common.enums';

export class PriceListDetailsDto {
  @IsString() country: string;
  @IsString() MCC: string;
  @IsString() MNC: string;
  @IsOptional() @IsString() oldPrice?: string;
  @IsString() price: string;
  @IsEnum(Currency) currency: Currency;
}
