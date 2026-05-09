import { IsString, MinLength, MaxLength } from 'class-validator';

export class DisputeOrderDto {
  @IsString()
  @MinLength(10, { message: '争议原因至少10个字符' })
  @MaxLength(500)
  reason: string;
}