import { Module } from '@nestjs/common';
import { DriversController, StoresController } from './entities.controller';
import { DriversService, StoresService } from './entities.service';

@Module({
  controllers: [DriversController, StoresController],
  providers: [DriversService, StoresService],
  exports: [DriversService, StoresService],
})
export class EntitiesModule {}
