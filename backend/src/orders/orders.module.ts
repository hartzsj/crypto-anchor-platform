import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaService } from '../prisma/prisma.service';
import { WalletsModule } from '../wallets/wallets.module';
import { ItemsModule } from '../items/items.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [WalletsModule, ItemsModule, NotificationsModule],
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService],
  exports: [OrdersService],
})
export class OrdersModule {}
