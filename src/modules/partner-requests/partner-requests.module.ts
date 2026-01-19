import { Module } from '@nestjs/common';
import { PartnerRequestsService } from './partner-requests.service';
import { PartnerRequestsController } from './partner-requests.controller';
import { SupabaseModule } from '../../common/supabase';

@Module({
  imports: [SupabaseModule],
  controllers: [PartnerRequestsController],
  providers: [PartnerRequestsService],
  exports: [PartnerRequestsService],
})
export class PartnerRequestsModule {}
