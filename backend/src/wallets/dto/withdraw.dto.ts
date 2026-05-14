import { IsNumber, IsString, IsOptional, Min, Max, MinLength } from 'class-validator';

export class WithdrawDto {
  @IsNumber()
  @Min(0.01, { message: '提现金额必须大于0' })
  @Max(1000000, { message: '单次提现不能超过100万' })
  amount: number;

  @IsString()
  @MinLength(10, { message: '提现地址格式无效' })
  address: string;

  @IsOptional()
  @IsString()
  network?: string;

  @IsOptional()
  @IsString()
  token?: string;
}