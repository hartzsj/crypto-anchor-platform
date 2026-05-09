import { IsString, MinLength, MaxLength } from 'class-validator';

export class ShipOrderDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  logisticsCompany: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  trackingNumber: string;
}