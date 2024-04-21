import { Currency } from '@/enums/common.enums';

// Interface for Price List Details
export interface IPriceListDetails {
  country: string;
  MCC: string;
  MNC: string;
  oldPrice?: string;
  price: string;
  currency: Currency;
}
