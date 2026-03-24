import { Expose } from 'class-transformer';

export class ResponseReviewDto {
  @Expose()
  id: number;

  @Expose()
  rating: number;

  @Expose()
  comment: string;

  @Expose()
  createdAt: Date;
}
