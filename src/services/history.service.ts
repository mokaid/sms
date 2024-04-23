import { HistoryModel } from '@/models/history.model';
import { HttpException } from '@/exceptions/HttpException';
import { Service } from 'typedi';

@Service()
export class HistoryService {
  public historyModel: any;

  public async findHistoryById(refId: string) {
    this.historyModel = HistoryModel;

    const history = await this.historyModel.find({ refId }).sort({ createdAt: -1 }).exec();

    if (!history) {
      throw new HttpException(409, "History doesn't exist");
    }

    return history;
  }
}
