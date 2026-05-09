import { Module } from '@nestjs/common';
import { TronController } from './tron.controller';
import { TronAddressService } from './tron-address.service';
import { TronMonitorService } from './tron-monitor.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletsModule } from '../wallets/wallets.module';

@Module({
  imports: [PrismaModule, WalletsModule],
  controllers: [TronController],
  providers: [TronAddressService, TronMonitorService],
  exports: [TronAddressService, TronMonitorService],
})
export class TronModule {}