import { Ref, Severity, modelOptions, prop } from '@typegoose/typegoose';

import { Account } from './accounts.model';
import { Currency } from '@/enums/common.enums';
import { Operator } from './operators.model';

@modelOptions({ options: { allowMixed: Severity.ALLOW }, schemaOptions: { collection: 'pricelistitems', timestamps: true } })
export class PriceListItem {
  @prop({ ref: () => Account, required: true })
  public account: Ref<Account>;

  @prop({ required: false })
  public country: string;

  @prop({ required: false })
  public MCC: string;

  @prop({ required: false })
  public MNC: string;

  @prop({ required: false })
  public oldPrice?: string;

  @prop({ required: false })
  public price: string;

  @prop({ type: String, required: true, enum: Currency, default: Currency.EUR })
  public currency: Currency;

  @prop({ ref: () => Operator, required: true })
  public operator: Ref<Operator>;
}
