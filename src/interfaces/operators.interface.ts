import { Active } from '@/enums/common.enums';

export interface IOperators {
  MCCMNC: string;
  zone?: string;
  country?: string;
  operator?: string;
  countryCode?: string;
  mobileCountryCode?: string;
  mobileNetworkCode?: string;
  MCC?: string;
  MNC?: string;
  active?: string;
  commonRef?:string
}

export interface IOperatorsModel {
  zone: string;
  country: string;
  operator: string;
  countryCode: string;
  mobileCountryCode: string;
  mobileNetworkCode: string;
  MCC: string;
  MNC: string;
  active: Active;
  commonRef:string

}
