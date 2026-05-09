import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(email: string, username: string, password: string, nickname: string) {
    // 检查邮箱和用户名是否已存在
    const existingEmail = await this.usersService.findByEmail(email);
    if (existingEmail) {
      throw new ConflictException('邮箱已被注册');
    }

    const existingUsername = await this.usersService.findByUsername(username);
    if (existingUsername) {
      throw new ConflictException('用户名已被使用');
    }

    // 创建用户
    const user = await this.usersService.create(email, username, password, nickname);

    // 返回 JWT，包含完整用户信息
    return this.generateToken(user.id, user.email, user.role, user.nickname, user.avatar);
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 返回 JWT，包含完整用户信息
    return this.generateToken(user.id, user.email, user.role, user.nickname, user.avatar);
  }

  async validateUser(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    return user;
  }

  private generateToken(userId: string, email: string, role: string, nickname?: string, avatar?: string | null) {
    const payload = { sub: userId, email, role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: userId,
        email,
        role,
        nickname: nickname || email.split('@')[0],
        avatar: avatar || null,
      },
    };
  }
}