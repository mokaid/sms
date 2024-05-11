import Container, { Service } from 'typedi';

import { CreateUserDto } from '@dtos/users.dto';
import { HttpException } from '@/exceptions/HttpException';
import { Model } from 'mongoose';
import { User } from '@interfaces/users.interface';
import { Users } from '@models/users.model';
import { hash } from 'bcrypt';

@Service()
export class UserService {
  private userModel: Model<Users>;

  constructor() {
    this.userModel = Container.get<Model<Users>>('UserModel');
  }

  public async findAllUser(): Promise<User[]> {
    const users: User[] = await this.userModel.find();
    return users;
  }

  public async findUserById(userId: string): Promise<User> {
    const findUser: User = await this.userModel.findOne({ _id: userId });
    if (!findUser) throw new HttpException(409, "User doesn't exist");

    return findUser;
  }

  public async createUser(userData: CreateUserDto): Promise<User> {
    const findUser: User = await this.userModel.findOne({ email: userData.email });
    if (findUser) throw new HttpException(409, `This email ${userData.email} already exists`);

    const hashedPassword = await hash(userData.password, 10);
    const createUserData: User = (await this.userModel.create({ ...userData, password: hashedPassword })) as Users;

    return createUserData;
  }

  public async updateUser(userId: string, userData: CreateUserDto): Promise<User> {
    if (userData.email) {
      const findUser: User = await this.userModel.findOne({ email: userData.email });
      if (findUser && findUser._id != userId) throw new HttpException(409, `This email ${userData.email} already exists`);
    }

    if (userData.password) {
      const hashedPassword = await hash(userData.password, 10);
      userData = { ...userData, password: hashedPassword };
    }

    const updateUserById: User = await this.userModel.findByIdAndUpdate(userId, { userData });
    if (!updateUserById) throw new HttpException(409, "User doesn't exist");

    return updateUserById;
  }

  public async deleteUser(userId: string): Promise<User> {
    const deleteUserById: User = await this.userModel.findByIdAndDelete(userId);
    if (!deleteUserById) throw new HttpException(409, "User doesn't exist");

    return deleteUserById;
  }
}
