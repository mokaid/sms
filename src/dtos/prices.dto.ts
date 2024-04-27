import { IsOptional, IsString } from 'class-validator';

export class PriceListDetailsDto {
  @IsOptional() @IsString() MCC: string;
  @IsOptional() @IsString() MNC: string;
  @IsOptional() @IsString() price: string;
}
