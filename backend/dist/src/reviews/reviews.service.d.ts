import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
export declare class ReviewsService {
    private prisma;
    private usersService;
    constructor(prisma: PrismaService, usersService: UsersService);
    createReview(orderId: string, reviewerId: string, rating: number, comment?: string): Promise<{
        id: string;
        createdAt: Date;
        orderId: string;
        reviewerId: string;
        revieweeId: string;
        rating: number;
        comment: string | null;
    }>;
}
