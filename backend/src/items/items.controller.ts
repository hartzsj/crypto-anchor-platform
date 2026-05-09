import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, Delete } from '@nestjs/common';
import { ItemsService } from './items.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateItemDto } from './dto/create-item.dto';
import { RejectItemDto } from './dto/reject-item.dto';

@Controller('items')
export class ItemsController {
  constructor(private itemsService: ItemsService) {}

  // 获取物品列表（公开）
  @Get()
  async findAll(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
  ) {
    return this.itemsService.findAll(skip || 0, take || 20, {
      status,
      category,
      search,
      minPrice,
      maxPrice,
    });
  }

  // 获取物品详情（公开）
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }

  // 创建物品（需要登录）
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Request() req, @Body() body: CreateItemDto) {
    return this.itemsService.create(
      req.user.id,
      body.title,
      body.description,
      body.images,
      body.price,
      body.category,
      body.location,
      body.serialNumber,
    );
  }

  // 获取我的物品
  @Get('my')
  @UseGuards(JwtAuthGuard)
  async findMyItems(@Request() req) {
    return this.itemsService.findBySellerId(req.user.id);
  }

  // 审核物品（管理员）
  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async approve(@Param('id') id: string, @Request() req) {
    return this.itemsService.approve(id, req.user.id);
  }

  // 拒绝物品（管理员）
  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async reject(@Param('id') id: string, @Body() body: RejectItemDto, @Request() req) {
    return this.itemsService.reject(id, body.reason, req.user.id);
  }

  // 删除物品
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @Request() req) {
    return this.itemsService.remove(id, req.user.id, req.user.role);
  }
}
