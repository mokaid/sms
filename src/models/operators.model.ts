import { Ref, Severity, modelOptions, prop } from '@typegoose/typegoose';

import { Active } from '@/enums/common.enums';
import { PriceListItem } from './prices.model';

@modelOptions({ options: { allowMixed: Severity.ALLOW }, schemaOptions: { collection: 'operators', timestamps: true } })
export class Operator {
  @prop({ required: false })
  public zone: string;

  @prop({ required: false })
  public country: string;

  @prop({ required: false })
  public operator: string;

  @prop({ required: false })
  public countryCode: string;

  @prop({ required: false })
  public mobileCountryCode: string;

  @prop({ required: false })
  public mobileNetworkCode: string;

  @prop({ required: false })
  public MCC: string;

  @prop({ required: false })
  public MNC: string;

  @prop({ required: true, enum: Active, type: String })
  public active: Active;

  @prop({ ref: () => PriceListItem })
  public priceList?: Ref<PriceListItem>[];

  @prop({ required: false })
  public commonRef: string;

}
