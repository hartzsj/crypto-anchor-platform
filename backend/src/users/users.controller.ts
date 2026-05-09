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
  async getMe(@Request() req) {
    const user = await this.usersService.findById(req.user.id);
    const stats = await this.usersService.getUserStats(req.user.id);
    return { ...user, stats };
  }

  // 更新个人资料
  @Put('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Request() req, @Body() body: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, body);
  }

  // 修改密码
  @Post('me/password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Request() req, @Body() body: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.id, body.oldPassword, body.newPassword);
  }

  // 获取我的物品
  @Get('me/items')
  @UseGuards(JwtAuthGuard)
  async getMyItems(@Request() req, @Query('skip') skip?: number, @Query('take') take?: number) {
    return this.usersService.getUserItems(req.user.id, skip || 0, take || 20);
  }

  // 获取我收到的评价
  @Get('me/reviews')
  @UseGuards(JwtAuthGuard)
  async getMyReviews(@Request() req, @Query('skip') skip?: number, @Query('take') take?: number) {
    return this.usersService.getUserReviews(req.user.id, skip || 0, take || 20);
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
