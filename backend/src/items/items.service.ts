import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ItemsService {
  constructor(private prisma: PrismaService) {}

  // 创建物品（卖家发布）
  async create(
    sellerId: string,
    title: string,
    description: string,
    images: string[],
    price: number,
    category: string,
    location?: string,
    serialNumber?: string,
  ) {
    if (price <= 0) {
      throw new BadRequestException('价格必须大于0');
    }

    return this.prisma.item.create({
      data: {
        sellerId,
        title,
        description,
        images,
        price,
        category,
        location,
        serialNumber,
        status: 'PENDING',
      },
    });
  }

  // 获取物品列表（支持分页和筛选）
  async findAll(
    skip = 0,
    take = 20,
    filters?: {
      category?: string;
      status?: string;
      search?: string;
      minPrice?: number;
      maxPrice?: number;
    },
  ) {
    const where: any = {};

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.status) {
      where.status = filters.status;
    } else {
      // 默认只显示已审核的物品
      where.status = 'APPROVED';
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.minPrice || filters?.maxPrice) {
      where.price = {};
      if (filters.minPrice) {
        where.price.gte = filters.minPrice;
      }
      if (filters.maxPrice) {
        where.price.lte = filters.maxPrice;
      }
    }

    const items = await this.prisma.item.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            nickname: true,
            reputation: true,
          },
        },
      },
    });

    const total = await this.prisma.item.count({ where });

    return { items, total };
  }

  // 获取单个物品详情
  async findOne(id: string) {
    const item = await this.prisma.item.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            nickname: true,
            reputation: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('物品不存在');
    }

    return item;
  }

  // 获取我的物品
  async findBySellerId(sellerId: string, skip = 0, take = 20) {
    const items = await this.prisma.item.findMany({
      where: { sellerId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.item.count({ where: { sellerId } });

    return { items, total };
  }

  // 审核物品（管理员）
  async approve(itemId: string, adminId: string) {
    const item = await this.prisma.item.findUnique({ where: { id: itemId } });
    
    if (!item) {
      throw new NotFoundException('物品不存在');
    }

    return this.prisma.item.update({
      where: { id: itemId },
      data: {
        status: 'APPROVED',
        approvedBy: adminId,
        approvedAt: new Date(),
      },
    });
  }

  // 拒绝物品（管理员）
  async reject(itemId: string, reason: string, adminId: string) {
    const item = await this.prisma.item.findUnique({ where: { id: itemId } });
    
    if (!item) {
      throw new NotFoundException('物品不存在');
    }

    return this.prisma.item.update({
      where: { id: itemId },
      data: {
        status: 'REJECTED',
        rejectedReason: reason,
        approvedBy: adminId,
      },
    });
  }

  // 更新物品状态为已售出
  async markAsSold(itemId: string) {
    return this.prisma.item.update({
      where: { id: itemId },
      data: {
        status: 'SOLD',
      },
    });
  }

  // 删除物品（仅卖家或管理员）
  async remove(itemId: string, userId: string, userRole: string) {
    const item = await this.prisma.item.findUnique({ where: { id: itemId } });
    
    if (!item) {
      throw new NotFoundException('物品不存在');
    }

    if (item.sellerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('无权删除此物品');
    }

    return this.prisma.item.delete({
      where: { id: itemId },
    });
  }
}
