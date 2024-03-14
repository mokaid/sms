import { ClassificationLevel, Currency } from '@/enums/profiles.enums';
import { Severity, getModelForClass, modelOptions, prop } from '@typegoose/typegoose';

class ProfileDetails {
  @prop({ type: String, required: true, maxlength: 255 })
  public legalName: string;

  @prop({ type: String, unique: true, required: true, maxlength: 255 })
  public accountingReference: string;

  @prop({ type: String, required: true, maxlength: 255 })
  public address: string;

  @prop({ type: String, required: true })
  public alertEmail: string;

  @prop({ type: String, required: true, maxlength: 255 })
  public accountManager: string;

  @prop({ type: String, required: true })
  public accountManagerEmail: string;

  @prop({ type: () => [String], required: true })
  public ratingEmails: string[];

  @prop({ type: () => [String], required: true })
  public billingEmails: string[];

  @prop({ type: String, required: true })
  public supportEmail: string;

  @prop({ type: () => [String], required: true })
  public dailyReportEmails: string[];

  @prop({ type: String, required: true, enum: ClassificationLevel })
  public classificationLevel: ClassificationLevel;

  @prop({ type: String, required: true })
  public phoneNumber: string;

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

  @prop({ type: String, required: true, maxlength: 255 })
  public country: string;

  @prop({ type: String, required: true, maxlength: 255 })
  public website: string;

  @prop({ type: String, required: true })
  public logo: string;

  @prop({ type: String, required: true })
  public vatRegistrationNumber: string;
}

class MO {
  @prop({ type: String, required: true })
  credit: string;
}

@modelOptions({ options: { allowMixed: Severity.ALLOW }, schemaOptions: { collection: 'profiles', timestamps: true } })
class Profile {
  @prop({ type: ProfileDetails, _id: false, required: true })
  public profileDetails: ProfileDetails;

  @prop({ type: MO, _id: false, required: true })
  public MO: MO;

  public createdAt?: Date;
  public updatedAt?: Date;
}

export const ProfileModel = getModelForClass(Profile);
