import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Config
import { appConfig, databaseConfig, supabaseConfig } from './config';

// Common
import { SupabaseModule } from './common/supabase';

// Feature Modules
import { AuthModule } from './modules/auth';
import { UsersModule } from './modules/users';
import { OrdersModule } from './modules/orders';
import { VehiclesModule } from './modules/vehicles';
import { ChargingStationsModule } from './modules/charging-stations';
import { GreenZonesModule } from './modules/green-zones';
import { EntitiesModule } from './modules/entities';
import { PricingModule } from './modules/pricing';
import { ReportsModule } from './modules/reports';
import { DashboardModule } from './modules/dashboard';
import { PartnersModule } from './modules/partners';
import { PartnerRequestsModule } from './modules/partner-requests';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, supabaseConfig],
    }),
    SupabaseModule,
    AuthModule,
    UsersModule,
    OrdersModule,
    VehiclesModule,
    ChargingStationsModule,
    GreenZonesModule,
    EntitiesModule,
    PricingModule,
    ReportsModule,
    DashboardModule,
    PartnersModule,
    PartnerRequestsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
