import { Model } from 'mongoose';
import { Inject, Service } from 'typedi';
import { HttpException } from '@/exceptions/HttpException';
import { Operator } from '@/models/operators.model';

@Service()
export class OperatorsService {
  constructor(@Inject('OperatorsModel') private operatorsModel: Model<Operator>) {}

  public async createOperator(operatorData: any) {
    const session = await this.operatorsModel.db.startSession();
    session.startTransaction();
    try {
      const operator = new this.operatorsModel(operatorData);
      await operator.save({ session });

      await session.commitTransaction();
      session.endSession();

      return operator;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error('Error during operator creation:', error);
      throw new HttpException(500, 'Error during operator creation');
    }
  }

  public async createOperators(operatorsData: {
    zone: string;
    country: string;
    operator: string;
    countryCode: string;
    mobileCountryCode: string;
    mobileNetworkCode: string;
    MCC: string;
    MNC: string;
    active: string;
  }) {
    const session = await this.operatorsModel.db.startSession();
    session.startTransaction();
    try {
      const operators = await this.operatorsModel.insertMany(operatorsData, { session });

      await session.commitTransaction();
      session.endSession();

      return operators;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error('Error during operators bulk creation:', error);
      throw new HttpException(500, 'Error during operators bulk creation');
    }
  }

  public async findOperatorById(operatorId: string) {
    const operator = await this.operatorsModel.findOne({ _id: operatorId }).exec();
    if (!operator) {
      throw new HttpException(404, "Operator doesn't exist");
    }
    return operator;
  }

  public async findAllOperators({ page = 1, limit = 10, orderBy = 'createdAt', sortOrder = 'asc', filters = {} }) {
    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const operatorFilters: Record<string, any> = {};
    Object.keys(filters).forEach(key => {
      if (typeof filters[key] === 'string' && filters[key]) {
        operatorFilters[key] = filters[key];
      } else if (typeof filters[key] === 'boolean') {
        operatorFilters[key] = filters[key];
      }
    });

    const query = this.operatorsModel
      .find(operatorFilters)
      .sort({ [orderBy]: sortDirection })
      .skip(skip)
      .limit(limit);

    const operators = await query.exec();
    const total = await this.operatorsModel.countDocuments(operatorFilters);

    return {
      data: operators,
      total,
    };
  }

  public async updateOperator(operatorId: string, updateData: any) {
    const operator = await this.operatorsModel.findByIdAndUpdate(operatorId, { $set: updateData }, { new: true }).exec();
    if (!operator) {
      throw new HttpException(404, 'Operator not found');
    }
    return operator;
  }
}
