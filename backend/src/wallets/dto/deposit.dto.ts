import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class DepositDto {
  @IsNumber()
  @Min(0.01, { message: '充值金额必须大于0' })
  @Max(1000000, { message: '单次充值不能超过100万' })
  amount: number;

  @IsOptional()
  @IsString()
  network?: string;

  @IsOptional()
  @IsString()
  token?: string;

  @IsOptional()
  @IsString()
  description?: string;
}