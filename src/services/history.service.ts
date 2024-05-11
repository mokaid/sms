import { Container, Service } from 'typedi';

import { History } from '@/models/history.model';
import { HttpException } from '@/exceptions/HttpException';
import { Model } from 'mongoose';

@Service()
export class HistoryService {
  private historyModel: Model<History>;

  constructor() {
    this.historyModel = Container.get<Model<History>>('HistoryModel');
  }

  public async findHistoryById(refId: string) {
    const history = await this.historyModel.find({ refId }).sort({ createdAt: -1 }).exec();

    if (!history) {
      throw new HttpException(409, "History doesn't exist");
    }

    return history;
  }
}
