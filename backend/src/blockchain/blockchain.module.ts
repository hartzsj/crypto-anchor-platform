import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BlockchainService } from './blockchain.service';
import { TronAdapter } from './tron.adapter';
import { BscAdapter } from './bsc.adapter';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [BlockchainService, TronAdapter, BscAdapter],
  exports: [BlockchainService],
})
export class BlockchainModule {}