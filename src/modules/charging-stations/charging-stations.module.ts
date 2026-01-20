import { Module } from '@nestjs/common';
import {
  DepotsController,
  ChargingController,
} from './charging-stations.controller';
import { DepotsService } from './charging-stations.service';

@Module({
  controllers: [DepotsController, ChargingController],
  providers: [DepotsService],
  exports: [DepotsService],
})
export class ChargingStationsModule {}
