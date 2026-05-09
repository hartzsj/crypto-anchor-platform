import { IsString, MinLength, MaxLength } from 'class-validator';

export class RejectItemDto {
  @IsString()
  @MinLength(5, { message: '拒绝原因至少5个字符' })
  @MaxLength(200)
  reason: string;
}