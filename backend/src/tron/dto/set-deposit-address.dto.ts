import { IsString, MinLength, Matches } from 'class-validator';

export class SetDepositAddressDto {
  @IsString()
  @MinLength(34)
  @Matches(/^T[A-Za-z1-9]{33}$/, { message: '无效的TRON地址格式，地址应以T开头，长度34' })
  address: string;
}