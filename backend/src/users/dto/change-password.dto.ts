import { IsString, MinLength, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(6, { message: '旧密码至少6位' })
  oldPassword: string;

  @IsString()
  @MinLength(6, { message: '新密码至少6位' })
  @MaxLength(50, { message: '新密码最多50位' })
  newPassword: string;
}