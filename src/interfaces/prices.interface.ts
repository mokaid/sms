export interface IPriceListDetails {
  oldPrice?: string;
  price?: string;
  mnc?: string;
  mcc?: string;
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
