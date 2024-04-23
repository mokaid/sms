import { DataStoredInToken, RequestWithUser } from '@interfaces/auth.interface';
import { NextFunction, Response } from 'express';

import Container from 'typedi';
import { HttpException } from '@/exceptions/HttpException';
import { SECRET_KEY } from '@config';
import { UserService } from '@/services/users.service';
import { verify } from 'jsonwebtoken';

const getAuthorization = req => {
  const coockie = req.cookies['Authorization'];
  if (coockie) return coockie;

  const header = req.header('Authorization');
  if (header) return header.split('Bearer ')[1];

  return null;
};

export const AuthMiddleware = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const Authorization = getAuthorization(req);

    if (Authorization) {
      const { _id } = (await verify(Authorization, SECRET_KEY)) as DataStoredInToken;
      const userService = Container.get(UserService);
      const findUser = await userService.findUserById(_id);

      if (findUser) {
        req.user = findUser;
        next();
      } else {
        next(new HttpException(401, 'Wrong authentication token'));
      }
    } else {
      next(new HttpException(404, 'Authentication token missing'));
    }
  } catch (error) {
    next(new HttpException(401, 'Wrong authentication token'));
  }
};
