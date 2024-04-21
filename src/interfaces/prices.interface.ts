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

export interface AccountFilters {
  price?: string;
  priceCondition?: string;
  oldPrice?: string;
  oldPriceCondition?: string;
  country?: string;
  mnc?: string;
  mcc?: string;
  currency?: string;
}
