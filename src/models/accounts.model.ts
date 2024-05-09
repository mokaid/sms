import { AccountCategory, AccountMode, AccountStatus, AccountType, BusinessType, ConnectionMode, FileFormat } from '@/enums/accounts.enums';
import { Ref, Severity, modelOptions, prop } from '@typegoose/typegoose';

import { Currency } from '@/enums/common.enums';
import { PriceListItem } from './prices.model';
import { Profile } from './profiles.model';

class AccountDetails {
  @prop({ type: String, required: true })
  public name: string;

  @prop({ type: String, required: true })
  public accountProfile: string;

  @prop({ type: String, required: true, enum: AccountType })
  public accountType: AccountType;

  @prop({ type: String, required: true, enum: BusinessType })
  public businessType: BusinessType;

  @prop({ type: String, required: true, enum: AccountCategory })
  public accountCategory: AccountCategory;

  @prop({ type: String, required: true, enum: AccountMode })
  public accountMode: AccountMode;

  @prop({ type: String, required: true, enum: AccountStatus })
  public accountStatus: AccountStatus;

  @prop({ type: String, required: true })
  public timeZone: string;

  @prop({ type: Boolean, required: true })
  public applyTimeZoneToInvoice: boolean;

  @prop({ type: Boolean, required: true })
  public applyTimeZoneToDailyReport: boolean;

  @prop({ type: Boolean, required: true })
  public applyTimeZoneToRateNotification: boolean;

  @prop({ type: String, required: true, enum: Currency })
  public currency: Currency;
}

class ConnectionDetails {
  @prop({ type: String, required: true, unique: true, index: true })
  public userName: string;

  @prop({ type: String, required: true })
  public password: string;

  @prop({ type: String, required: false })
  public ipAddress: string;

  @prop({ type: Number, required: false })
  public port: number;

  @prop({ type: Number, required: false, default: 0 })
  public sourceTon?: number;

  @prop({ type: Number, required: false, default: 0 })
  public sourceNpi?: number;

  @prop({ type: Number, required: false, default: 0 })
  public destTon?: number;

  @prop({ type: Number, required: false, default: 0 })
  public destNpi?: number;

  @prop({ type: Number, required: false, default: 5 })
  public maximumConnections?: number;

  @prop({ type: Number, required: false, default: 1 })
  public connectionToOpen?: number;

  @prop({ type: Number, required: false, default: 10 })
  public windowSize?: number;

  @prop({ type: Number, required: false, default: 60 })
  public enquireLink?: number;

  @prop({ type: Number, required: false, default: 50 })
  public submitPerSecond?: number;

  @prop({ type: Number, required: false, default: 20 })
  public clientSubmitPerSecond?: number;

  @prop({ type: Number, required: false, default: 20 })
  public queueToSend?: number;

  @prop({ type: String, enum: ConnectionMode, required: false, default: ConnectionMode.Transceiver })
  public connectionMode?: ConnectionMode;

  @prop({ type: String, required: true, minlength: 3, maxlength: 5 })
  public translationPrefix: string;
}

class EmailCoveragelistDetails {
  @prop({ type: String, required: true })
  public email: string;

  @prop({ type: String, required: true, enum: FileFormat })
  public fileFormat: FileFormat;

  @prop({ type: String, required: true })
  public partialFileName: AccountType;

  @prop({ type: Boolean, default: false })
  deleteAllExisting: boolean;
}

@modelOptions({ options: { allowMixed: Severity.ALLOW }, schemaOptions: { collection: 'accounts', timestamps: true } })
export class Account {
  @prop({ ref: () => Profile, required: true })
  public profile: Ref<Profile>;

  @prop({ type: () => AccountDetails, _id: false, required: true })
  public details: AccountDetails;

  @prop({ type: () => ConnectionDetails, _id: false, required: true })
  public connection: ConnectionDetails;

  @prop({ type: () => EmailCoveragelistDetails, _id: false, required: false })
  public emailCoverageList?: EmailCoveragelistDetails;

  @prop({ ref: () => PriceListItem })
  public priceList?: Ref<PriceListItem>[];
}
