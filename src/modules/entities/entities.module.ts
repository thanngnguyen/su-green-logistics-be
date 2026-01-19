import { Module } from '@nestjs/common';
import {
  SuppliersController,
  DriversController,
  StoresController,
} from './entities.controller';
import {
  SuppliersService,
  DriversService,
  StoresService,
} from './entities.service';

@Module({
  controllers: [SuppliersController, DriversController, StoresController],
  providers: [SuppliersService, DriversService, StoresService],
  exports: [SuppliersService, DriversService, StoresService],
})
export class EntitiesModule {}
