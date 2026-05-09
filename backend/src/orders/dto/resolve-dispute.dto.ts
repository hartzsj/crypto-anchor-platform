import { IsBoolean } from 'class-validator';

export class ResolveDisputeDto {
  @IsBoolean()
  refund: boolean;
}