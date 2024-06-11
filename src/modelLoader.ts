import { Account } from './models/accounts.model';
import { Configuration } from './models/configurations.model';
import { Container } from 'typedi';
import { History } from './models/history.model'; // Include if you have a History model as well.
import { Operator } from './models/operators.model'; // Added import for Operators model
import { PriceListItem } from './models/prices.model';
import { Profile } from './models/profiles.model';
import { Users } from './models/users.model';
import { getModelForClass } from '@typegoose/typegoose';
import { Sell } from './models/sell.model';

export function initializeModels(): void {
  console.log('Initializing models...');

  // Get models from Typegoose
  const UserModel = getModelForClass(Users);
  const ProfileModel = getModelForClass(Profile);
  const AccountModel = getModelForClass(Account);
  const PriceListItemModel = getModelForClass(PriceListItem);
  const HistoryModel = getModelForClass(History);
  const OperatorsModel = getModelForClass(Operator);
  const ConfigurationsModel = getModelForClass(Configuration);
  const SellModel = getModelForClass(Sell);

  // Set models in TypeDI container
  Container.set('UserModel', UserModel);
  Container.set('ProfileModel', ProfileModel);
  Container.set('AccountModel', AccountModel);
  Container.set('PriceListItemModel', PriceListItemModel);
  Container.set('HistoryModel', HistoryModel);
  Container.set('OperatorsModel', OperatorsModel);
  Container.set('ConfigurationsModel', ConfigurationsModel);
  Container.set('SellModel', SellModel);


  console.log('Models initialized and set in container');
}
