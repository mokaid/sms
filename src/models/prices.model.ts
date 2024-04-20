import { Ref, Severity, modelOptions, prop } from '@typegoose/typegoose';

import { Account } from './accounts.model';
import { Currency } from '@/enums/profiles.enums';

@modelOptions({ options: { allowMixed: Severity.ALLOW }, schemaOptions: { collection: 'pricelistitems', timestamps: true } })
export class PriceListItem {
  @prop({ ref: () => Account, required: true })
  public account: Ref<Account>;

  @prop({ required: true })
  public country: string;

  @prop({ required: true })
  public MCC: string;

  @prop({ required: true })
  public MNC: string;

  @prop({ required: false })
  public oldPrice?: string;

  @prop({ required: true })
  public price: string;

  @prop({ type: String, required: true, enum: Currency, default: Currency.EUR })
  public currency: Currency;
}
