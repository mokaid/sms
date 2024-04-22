import { Account } from './models/accounts.model';
import { Container } from 'typedi';
import { PriceListItem } from './models/prices.model';
import { Profile } from './models/profiles.model';
import { Users } from './models/users.model';
import { getModelForClass } from '@typegoose/typegoose';

export function initializeModels(): void {
  console.log('Initializing models...');
  const UserModel = getModelForClass(Users);
  const ProfileModel = getModelForClass(Profile);
  const AccountModel = getModelForClass(Account);
  const PriceListItemModel = getModelForClass(PriceListItem);

  Container.set('UserModel', UserModel);
  Container.set('ProfileModel', ProfileModel);
  Container.set('AccountModel', AccountModel);
  Container.set('PriceListItemModel', PriceListItemModel);
  console.log('Models initialized and set in container');
}
