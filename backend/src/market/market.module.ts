import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MarketService } from './market.service';
import { MarketController } from './market.controller';

@Module({
  imports: [ConfigModule],
  controllers: [MarketController],
  providers: [MarketService],
  exports: [MarketService],
})
export class MarketModule {}