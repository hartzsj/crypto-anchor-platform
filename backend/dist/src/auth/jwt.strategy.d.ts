import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private authService;
    private configService;
    constructor(authService: AuthService, configService: ConfigService);
    validate(payload: any): Promise<{
        wallet: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
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
}
export {};
