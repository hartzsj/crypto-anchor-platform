import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BlockchainService } from './blockchain.service';
import { BlockchainController } from './blockchain.controller';
import { DepositMonitorService } from './deposit-monitor.service';
import { TronAdapter } from './tron.adapter';
import { BscAdapter } from './bsc.adapter';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletsModule } from '../wallets/wallets.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ConfigModule, PrismaModule, WalletsModule, AuthModule],
  controllers: [BlockchainController],
  providers: [BlockchainService, DepositMonitorService, TronAdapter, BscAdapter],
  exports: [BlockchainService, DepositMonitorService],
})
export class BlockchainModule {}