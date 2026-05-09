import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[\w-]+$/, { message: '用户名只能包含字母、数字、下划线和横线' })
  username: string;

  @IsString()
  @MinLength(6, { message: '密码至少6位' })
  @MaxLength(50)
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(20)
  nickname: string;
}