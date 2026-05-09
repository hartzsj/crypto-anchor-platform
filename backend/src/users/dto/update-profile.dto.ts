import { IsString, MinLength, MaxLength, IsOptional, IsUrl, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: '昵称至少2个字符' })
  @MaxLength(20, { message: '昵称最多20个字符' })
  nickname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '简介最多500个字符' })
  bio?: string;

  @IsOptional()
  @IsString()
  @Matches(
    /^(https?:\/\/|data:image\/)/,
    { message: '头像必须是有效的URL或图片数据' }
  )
  avatar?: string;
}