import { Controller, Get, Put, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  // 获取当前用户信息（需要登录）
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req: any) {
    const userId = req.user.id || req.user.userId;
    const user = await this.usersService.findById(userId);
    const stats = await this.usersService.getUserStats(userId);
    return { ...user, stats };
  }

  // 更新个人资料
  @Put('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Request() req: any, @Body() body: UpdateProfileDto) {
    const userId = req.user.id || req.user.userId;
    const updatedUser = await this.usersService.updateProfile(userId, body);
    // 返回更新后的用户信息，方便前端更新 localStorage
    return updatedUser;
  }

  // 修改密码
  @Post('me/password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Request() req: any, @Body() body: ChangePasswordDto) {
    const userId = req.user.id || req.user.userId;
    return this.usersService.changePassword(userId, body.oldPassword, body.newPassword);
  }

  // 获取我的物品
  @Get('me/items')
  @UseGuards(JwtAuthGuard)
  async getMyItems(@Request() req: any, @Query('skip') skip?: number, @Query('take') take?: number) {
    const userId = req.user.id || req.user.userId;
    return this.usersService.getUserItems(userId, skip || 0, take || 20);
  }

  // 获取我收到的评价
  @Get('me/reviews')
  @UseGuards(JwtAuthGuard)
  async getMyReviews(@Request() req: any, @Query('skip') skip?: number, @Query('take') take?: number) {
    const userId = req.user.id || req.user.userId;
    return this.usersService.getUserReviews(userId, skip || 0, take || 20);
  }

  // 获取用户公开信息
  @Get(':id/public')
  async getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }

  // 获取用户发布的物品（公开）
  @Get(':id/items')
  async getUserItems(@Param('id') id: string, @Query('skip') skip?: number, @Query('take') take?: number) {
    return this.usersService.getUserItems(id, skip || 0, take || 20);
  }

  // 获取用户收到的评价（公开）
  @Get(':id/reviews')
  async getUserReviews(@Param('id') id: string, @Query('skip') skip?: number, @Query('take') take?: number) {
    return this.usersService.getUserReviews(id, skip || 0, take || 20);
  }

  // 管理员查看所有用户
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Request() req,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    if (req.user.role !== 'ADMIN') {
      return [];
    }
    return this.usersService.findAll(skip || 0, take || 50);
  }
}
