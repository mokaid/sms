import { IsOptional, IsString } from 'class-validator';

export class ConfigurationDto {
  @IsOptional()
  @IsString()
  public numberOfDigits?: string;

  @IsOptional()
  @IsString()
  public timeZone?: string;

  @IsOptional()
  @IsString()
  public systemCurrency?: string;

  @IsOptional()
  @IsString()
  public documentLimitSize?: string;

  @IsOptional()
  @IsString()
  public rateSheetTemplate?: string;

  @IsOptional()
  @IsString()
  public exchangeRateUpdateMargin?: string;

  @IsOptional()
  @IsString()
  public sellRatesEmailSubject?: string;

  @IsOptional()
  @IsString()
  public sellRatesEmailBody?: string;

  @IsOptional()
  @IsString()
  public sellRatesEmailFileName?: string;



}
