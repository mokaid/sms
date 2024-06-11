import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PriceItemDto {
  @IsString()
  price: string; 

  @IsNumber() // Assuming you need to pass IDs or simple fields only
  currentPrice: number;

  @IsNumber() // Adjusted for consistency; use IsNumber if actual numbers are required
  sellPrice: number;

}

export class SellDto {
  @IsString()
  account: string; // Use simple strings for IDs if that's all that's needed

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceItemDto)
  priceItems: PriceItemDto[];
}
