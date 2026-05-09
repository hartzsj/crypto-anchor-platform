import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取用户通知设置
   */
  @Get('settings')
  async getSettings(@Request() req: any) {
    const userId = req.user.userId;

    let settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      // 创建默认设置
      settings = await this.prisma.userSettings.create({
        data: {
          userId,
          emailNotify: true,
          smsNotify: false,
          notifyEvents: ['order_paid', 'order_shipped', 'order_completed', 'deposit_received'],
        },
      });
    }

    return settings;
  }

  /**
   * 更新通知设置
   */
  @Put('settings')
  async updateSettings(
    @Request() req: any,
    @Body() body: { emailNotify?: boolean; smsNotify?: boolean; notifyEvents?: string[] },
  ) {
    const userId = req.user.userId;

    const settings = await this.prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        emailNotify: body.emailNotify ?? true,
        smsNotify: body.smsNotify ?? false,
        notifyEvents: body.notifyEvents ?? ['order_paid', 'order_shipped', 'order_completed', 'deposit_received'],
      },
      update: {
        emailNotify: body.emailNotify,
        smsNotify: body.smsNotify,
        notifyEvents: body.notifyEvents,
      },
    });

    return settings;
  }
}