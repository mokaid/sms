import { Account } from './models/accounts.model';
import { Container } from 'typedi';
import { History } from './models/history.model'; // Include if you have a History model as well.
import { Operator } from './models/operators.model'; // Added import for Operators model
import { PriceListItem } from './models/prices.model';
import { Profile } from './models/profiles.model';
import { Users } from './models/users.model';
import { getModelForClass } from '@typegoose/typegoose';

export function initializeModels(): void {
  console.log('Initializing models...');

  // Get models from Typegoose
  const UserModel = getModelForClass(Users);
  const ProfileModel = getModelForClass(Profile);
  const AccountModel = getModelForClass(Account);
  const PriceListItemModel = getModelForClass(PriceListItem);
  const HistoryModel = getModelForClass(History); // Assuming you have this
  const OperatorsModel = getModelForClass(Operator); // Get model for Operators

  // Set models in TypeDI container
  Container.set('UserModel', UserModel);
  Container.set('ProfileModel', ProfileModel);
  Container.set('AccountModel', AccountModel);
  Container.set('PriceListItemModel', PriceListItemModel);
  Container.set('HistoryModel', HistoryModel); // Set History model if you have it
  Container.set('OperatorsModel', OperatorsModel); // Set Operators model in container

  console.log('Models initialized and set in container');
}
