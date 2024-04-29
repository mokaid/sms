import { NextFunction, Request, Response } from 'express';

import { Container } from 'typedi';
import { OperatorsService } from '@/services/operators.service';

export class OperatorsController {
  public operatorService = Container.get(OperatorsService);

  public addOperator = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const operatorData = req.body;
      const createOperatorData = await this.operatorService.createOperator(operatorData);

      res.status(201).json({ data: createOperatorData, message: 'Operator created' });
    } catch (error) {
      next(error);
    }
  };

  public getOperators = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const orderBy = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = (req.query.sortOrder as string) || 'asc';

      const filters = {
        country: req.query.country as string,
        zone: req.query.zone as string,
        operator: req.query.operator as string,
        countryCode: req.query.countryCode as string,
        mobileCountryCode: req.query.mobileCountryCode as string,
        mobileNetworkCode: req.query.mobileNetworkCode as string,
        MCC: req.query.MCC as string,
        MNC: req.query.MNC as string,
        active: req.query.active as string,
      };

      Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

      const { data, total } = await this.operatorService.findAllOperators({
        page,
        limit,
        orderBy,
        sortOrder,
        filters,
      });

      // Respond with data
      res.status(200).json({
        data: data,
        total: total,
        page: page,
        limit: limit,
        message: 'Operators retrieved successfully',
      });
    } catch (error) {
      console.error('Error fetching operator details:', error);
      next(error);
    }
  };

  public getOperatorById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const operatorId: string = req.params.id;
      const findOneOperatorData = await this.operatorService.findOperatorById(operatorId);

      res.status(200).json({ data: findOneOperatorData, message: 'Operator found' });
    } catch (error) {
      next(error);
    }
  };

  public updateOperator = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const operatorId: string = req.params.id;
      const operatorData = req.body;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { MCC, MNC, ...updateData } = operatorData;

      const updateOperatorData = await this.operatorService.updateOperator(operatorId, updateData);

      res.status(200).json({ data: updateOperatorData, message: 'Operator updated' });
    } catch (error) {
      next(error);
    }
  };
}
