import { DataStoredInToken, TokenData } from '@interfaces/auth.interface';
import { compare, hash } from 'bcrypt';

import { HttpException } from '@/exceptions/HttpException';
import { SECRET_KEY } from '@config';
import { Inject, Service } from 'typedi';
import { sign } from 'jsonwebtoken';
import { Model } from 'mongoose';
import { User } from '@/interfaces/users.interface';
import { Users } from '@/models/users.model';

const createToken = (user: User): TokenData => {
  const dataStoredInToken: DataStoredInToken = { _id: user._id };
  const expiresIn: number = 600 * 60;

  return { expiresIn, token: sign(dataStoredInToken, SECRET_KEY, { expiresIn }) };
};

const createCookie = (tokenData: TokenData): string => {
  return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn};`;
};

@Service()
export class AuthService {
  constructor(@Inject('UserModel') private userModel: Model<Users>) {}

  public async signup(userData: User): Promise<User> {
    const findUser: User = await this.userModel.findOne({ email: userData.email });
    if (findUser) throw new HttpException(409, `This email ${userData.email} already exists`);

    const hashedPassword = await hash(userData.password, 10);
    const createUserData: User = (await this.userModel.create({ ...userData, password: hashedPassword })) as Users;

    return createUserData;
  }

  public async login(userData: User): Promise<{ cookie: string; findUser: User; tokenData: TokenData }> {
    const findUser: User = await this.userModel.findOne({ email: userData.email });
    if (!findUser) throw new HttpException(409, `This email ${userData.email} was not found`);

    const isPasswordMatching: boolean = await compare(userData.password, findUser.password);
    if (!isPasswordMatching) throw new HttpException(409, 'Password is not matching');

    const tokenData = createToken(findUser);
    const cookie = createCookie(tokenData);

    return { cookie, findUser, tokenData };
  }

  public async logout(userData: User): Promise<User> {
    const findUser: Users = await this.userModel.findOne({ email: userData.email });
    if (!findUser) throw new HttpException(409, `This email ${userData.email} was not found`);

    return findUser;
  }
}
