import { NextFunction, Request, Response } from 'express';

import { ConfigurationService } from '@/services/configurations.service';
import { Container } from 'typedi';

export class ConfigurationController {
  public configurationService = Container.get(ConfigurationService);

  public getAllConfigurations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const configurations = await this.configurationService.findAllConfigurations();
      res.status(200).json({
        data: configurations,
        message: 'Configurations retrieved successfully',
      });
    } catch (error) {
      console.error('Error fetching configurations:', error);
      next(error);
    }
  };

  public updateConfiguration = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const configData = req.body;

      const updatedConfiguration = await this.configurationService.updateOrCreateConfiguration(configData);
      if (!updatedConfiguration) {
        throw new Error('Configuration not found or update failed');
      }

      res.status(200).json({
        data: updatedConfiguration,
        message: 'Configuration updated successfully',
      });
    } catch (error) {
      console.error('Error updating configuration:', error);
      res.status(404).json({ message: error.message });
    }
  };
}
