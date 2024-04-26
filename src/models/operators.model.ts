import { Severity, modelOptions, prop } from '@typegoose/typegoose';

@modelOptions({ options: { allowMixed: Severity.ALLOW }, schemaOptions: { collection: 'operators', timestamps: true } })
export class Operators {
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
  public MCCMNC: string;

  @prop({ required: false })
  public zoneId: string;

  @prop({ required: false })
  public countryId: string;

  @prop({ required: false })
  public operatorId: string;

  @prop({ required: false })
  public active: string;
}
