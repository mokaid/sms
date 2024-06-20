import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PriceItemDto {
  @IsString()
  price: string; 

  @IsNumber() 
  currentPrice: number;

  @IsNumber() 
  sellPrice: number;

}

export class SellDto {
  @IsString()
  account: string; 

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceItemDto)
  priceItems: PriceItemDto[];
}
