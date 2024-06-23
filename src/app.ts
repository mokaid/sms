import 'reflect-metadata';

import { CREDENTIALS, LOG_FORMAT, NODE_ENV, ORIGIN, PORT } from '@config';
import { logger, stream } from '@utils/logger';
import mongoose, { Model } from 'mongoose';

import Container from 'typedi';
import EmailFetcherService from './services/email.service';
import { ErrorMiddleware } from '@middlewares/error.middleware';
import { History } from './models/history.model';
import { OperatorsService } from './services/operators.service';
import { Routes } from '@interfaces/routes.interface';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { dbConnection } from '@database';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import { initializeModels } from './modelLoader';
import morgan from 'morgan';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

initializeModels();

const events = ['SIGTERM', 'SIGINT', 'beforeExit', 'rejectionHandled', 'unhandledRejection', 'uncaughtException', 'exit'];
events.forEach(eventName => {
  console.log('listening on ', eventName);
  process.on(eventName, (...args) => {
    console.log('event ' + eventName + ' was called with args : ' + args.join(','));
    process.exit(1);
  });
});

class App {
  public app: express.Application;
  public env: string;
  public port: string | number;
  private historyModel: Model<History>;

  constructor(routes: Routes[]) {
    this.app = express();
    this.env = NODE_ENV || 'development';
    this.port = PORT || 3000;

    this.connectToDatabase();
    this.initializeMiddlewares();
    this.initializeRoutes(routes);
    this.initializeSwagger();
    this.initializeErrorHandling();
    this.initializeEmailFetcher();
    // this.defaultOperatorRecord();
    this.historyModel = Container.get<Model<History>>('HistoryModel');
  }

  public async listen() {
    this.app.listen(this.port, () => {
      logger.info(`=================================`);
      logger.info(`======= ENV: ${this.env} =======`);
      logger.info(`🚀 App listening on the port ${this.port}`);
      logger.info(`=================================`);
    });
    // await import('./modelLoader').then(module => module.initializeModels());
  }

  public getServer() {
    return this.app;
  }

  private async connectToDatabase() {
    await dbConnection();
    this.watchDatabaseChanges();
  }

  private async watchDatabaseChanges() {
    const collections = ['profiles', 'pricelistitems', 'accounts'];
    const pipeline = [{ $match: { operationType: { $in: ['update'] }, 'updateDescription.updatedFields': { $exists: true } } }];

    collections.forEach(collection => {
      const changeStream = mongoose.connection.collection(collection).watch(pipeline, { fullDocument: 'updateLookup' });
      changeStream.on('change', async (change: any) => {
        //console.log(`Change detected in ${collection}:`, change);

        if (change.updateDescription && change.updateDescription.updatedFields) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { updatedAt, ...updatedFields } = change.updateDescription.updatedFields;

          if (Object.keys(updatedFields).length > 0) {
            const changes: Record<string, any>[] = [];
            for (const key in updatedFields) {
              changes.push({ [key]: updatedFields[key] });
            }

            const historyEntry = new this.historyModel({
              model: collection,
              refId: change.documentKey._id.toString(),
              fields: changes,
            });

            historyEntry.save().catch(console.error);
          } else {
            console.log('No significant fields updated, not creating a history record.');
          }
        }
      });

      changeStream.on('error', (error: Error) => {
        console.error(`Change stream error in ${collection}:`, error);
      });
    });
  }

  private initializeMiddlewares() {
    this.app.use(morgan(LOG_FORMAT, { stream }));
    this.app.use(cors({ origin: ORIGIN, credentials: CREDENTIALS }));
    this.app.use(hpp());
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());
  }
  private initializeEmailFetcher() {
    Container.get(EmailFetcherService);
    console.log('Email fetcher initialized and started');
  }

  // private async defaultOperatorRecord() {
  //   const operatorsService = Container.get(OperatorsService);
  //   try {
  //     await operatorsService.ensureDefaultOperatorExists();
  //     console.log('Default operator record ensured.');
  //   } catch (error) {
  //     console.error('Failed to ensure default operator record:', error);
  //   }
  // }

  private initializeRoutes(routes: Routes[]) {
    routes.forEach(route => {
      this.app.use('/', route.router);
    });
  }

  private initializeSwagger() {
    const options = {
      swaggerDefinition: {
        info: {
          title: 'REST API',
          version: '.0.0',
          description: 'Example docs',
        },
      },
      apis: ['swagger.yaml'],
    };

    const specs = swaggerJSDoc(options);
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  }

  private initializeErrorHandling() {
    this.app.use(ErrorMiddleware);
  }
}

export default App;
