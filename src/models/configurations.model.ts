import { Severity, modelOptions, prop } from '@typegoose/typegoose';

@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { collection: 'configurations', timestamps: true },
})
export class Configuration {
  @prop({ required: false })
  public numberOfDigits?: string;

  @prop({ required: false })
  public timeZone?: string;

  @prop({ required: false })
  public systemCurrency?: string;

  @prop({ required: false })
  public documentLimitSize?: string;

  @prop({ required: false })
  public rateSheetTemplate?: string;

  @prop({ required: false })
  public exchangeRateUpdateMargin?: string;

  @prop({ required: false })
  public sellRatesEmailSubject?: string;

  @prop({ required: false })
  public sellRatesEmailBody?: string;

  @prop({ required: false })
  public sellRatesEmailFileName?: string;


}
