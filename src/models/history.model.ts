import { Severity, index, modelOptions, prop } from '@typegoose/typegoose';

import mongoose from 'mongoose';

export class FieldChanges {
  [key: string]: any;
}

@index({ refId: 1, operation: 1 })
@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { collection: 'history', timestamps: true },
})
export class History {
  @prop({ required: true })
  public model: string;

  @prop({ required: true })
  public refId: string;

  @prop({ type: () => [mongoose.Schema.Types.Mixed], required: true })
  public fields: any[];
}
