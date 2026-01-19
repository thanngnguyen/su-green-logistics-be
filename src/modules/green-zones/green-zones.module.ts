import { Module } from '@nestjs/common';
import { GreenZonesController } from './green-zones.controller';
import { GreenZonesService } from './green-zones.service';

@Module({
  controllers: [GreenZonesController],
  providers: [GreenZonesService],
  exports: [GreenZonesService],
})
export class GreenZonesModule {}
