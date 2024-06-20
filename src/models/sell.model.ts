import { Ref, Severity, modelOptions, prop } from '@typegoose/typegoose';
import { Account } from './accounts.model';
import { PriceListItem } from './prices.model';

class PriceItem {

  @prop({ ref: () => PriceListItem })
  public price?: Ref<PriceListItem>;

  @prop({ required: true })
  public currentPrice: number;

  @prop({ required: true })
  public sellPrice: number;

  public get profit(): number {
    return this.sellPrice - this.currentPrice;
  }
}

@modelOptions({ options: { allowMixed: Severity.ALLOW }, schemaOptions: { collection: 'sell', timestamps: true } })
export class Sell {
  @prop({ ref: () => Account, required: true })
  public account: Ref<Account>;

  @prop({ type: () => PriceItem, required: true })
  public priceItems: PriceItem[];

  @prop({ type: () => String, required: false })
  public attachmentData?: string; 
}
