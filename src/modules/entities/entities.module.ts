import { Module } from '@nestjs/common';
import { DriversController } from './entities.controller';
import { DriversService } from './entities.service';

@Module({
  controllers: [DriversController],
  providers: [DriversService],
  exports: [DriversService],
})
export class EntitiesModule {}
