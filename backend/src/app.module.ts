import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WalletsModule } from './wallets/wallets.module';
import { ItemsModule } from './items/items.module';
import { OrdersModule } from './orders/orders.module';
import { ReviewsModule } from './reviews/reviews.module';
import { TronModule } from './tron/tron.module';
import { AdminModule } from './admin/admin.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { MarketModule } from './market/market.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(), // 启用定时任务
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60秒
        limit: 100, // 每分钟最多100次请求（全局）
      },
    ]),
    AuthModule,
    UsersModule,
    WalletsModule,
    ItemsModule,
    OrdersModule,
    ReviewsModule,
    TronModule, // TRON充值监听模块
    AdminModule, // 管理后台模块
    BlockchainModule, // 多链区块链托管模块
    MarketModule, // 行情数据模块
    NotificationsModule, // 通知模块（邮件/短信）
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
