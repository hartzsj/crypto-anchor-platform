import { IsString, IsNumber, IsArray, Min, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreateItemDto {
  @IsString()
  @MinLength(5, { message: '标题至少5个字符' })
  @MaxLength(100)
  title: string;

  @IsString()
  @MinLength(20, { message: '描述至少20个字符' })
  @MaxLength(2000)
  description: string;

  @IsArray()
  @IsString({ each: true })
  images: string[];

  @IsNumber()
  @Min(0.01, { message: '价格必须大于0' })
  price: number;

  @IsString()
  @MinLength(1)
  category: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;
}