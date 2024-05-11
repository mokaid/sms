import Container, { Service } from 'typedi';

import { Configuration } from '@/models/configurations.model';
import { HttpException } from '@/exceptions/HttpException';
import { Model } from 'mongoose';

@Service()
export class ConfigurationService {
  private configurationModel: Model<Configuration>;

  constructor() {
    this.configurationModel = Container.get<Model<Configuration>>('ConfigurationsModel');
  }
  public async findAllConfigurations() {
    try {
      const configurations = await this.configurationModel.find({});
      return configurations;
    } catch (error) {
      console.error('Error fetching configurations:', error);
      throw new HttpException(500, 'Error during fetching configurations');
    }
  }

  public async updateOrCreateConfiguration(configData: any) {
    const session = await this.configurationModel.db.startSession();
    try {
      session.startTransaction();
      const options = { upsert: true, new: true, session: session };
      const query = {};
      const updatedConfiguration = await this.configurationModel.findOneAndUpdate(query, configData, options).exec();

      await session.commitTransaction();
      session.endSession();
      return updatedConfiguration;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error('Error updating or creating configuration:', error);
      throw new HttpException(500, 'Error updating or creating configuration');
    }
  }
}
