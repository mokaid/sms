import { IsOptional, IsString } from 'class-validator';

export class OperatorsDto {
  @IsOptional()
  @IsString()
  zone?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  operator?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  mobileCountryCode?: string;

  @IsOptional()
  @IsString()
  mobileNetworkCode?: string;

  @IsOptional()
  @IsString()
  MCCMNC?: string;

  @IsOptional()
  active?: string;
}
