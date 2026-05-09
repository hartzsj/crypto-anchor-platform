import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
export declare class ReviewsController {
    private reviewsService;
    constructor(reviewsService: ReviewsService);
    createReview(req: any, body: CreateReviewDto): Promise<{
        id: string;
        createdAt: Date;
        orderId: string;
        reviewerId: string;
        revieweeId: string;
        rating: number;
        comment: string | null;
    }>;
}
