import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    register(email: string, username: string, password: string, nickname: string): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            role: string;
        };
    }>;
    login(email: string, password: string): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            role: string;
        };
    }>;
    validateUser(userId: string): Promise<{
        wallet: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            balance: import("@prisma/client/runtime/library").Decimal;
            frozenBalance: import("@prisma/client/runtime/library").Decimal;
            depositAddress: string | null;
        } | null;
    } & {
        id: string;
        email: string;
        username: string;
        password: string;
        avatar: string | null;
        nickname: string;
        role: import("@prisma/client").$Enums.Role;
        reputation: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    private generateToken;
    private compareHash;
}
