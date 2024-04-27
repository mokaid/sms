import { Ref, Severity, modelOptions, prop } from '@typegoose/typegoose';

import { Account } from './accounts.model';
import { Operator } from './operators.model';

@modelOptions({ options: { allowMixed: Severity.ALLOW }, schemaOptions: { collection: 'pricelistitems', timestamps: true } })
export class PriceListItem {
  @prop({ ref: () => Account, required: true })
  public account: Ref<Account>;

  @prop({ required: false })
  public oldPrice?: string;

  @prop({ required: false })
  public price: string;

  @prop({ ref: () => Operator, required: true })
  public operator: Ref<Operator>;
}
