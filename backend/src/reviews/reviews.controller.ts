import { Controller, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateReviewDto } from './dto/create-review.dto';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  // 创建评价
  @Post()
  async createReview(
    @Request() req,
    @Body() body: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(
      body.orderId,
      req.user.id,
      body.rating,
      body.comment,
    );
  }
}
