import { IsUUID, IsInt, IsOptional, IsString, Min, Max, MinLength, MaxLength } from 'class-validator';

export class CreateReviewDto {
  @IsUUID()
  orderId: string;

  @IsInt()
  @Min(1, { message: '评分最低1星' })
  @Max(5, { message: '评分最高5星' })
  rating: number;

  @IsOptional()
  @IsString()
  @MinLength(5, { message: '评论至少5个字符' })
  @MaxLength(500, { message: '评论最多500个字符' })
  comment?: string;
}