import { Expose, Type } from "class-transformer";
import { ProductRequestDto } from "src/products/entities/dto/product-request.dto";
import { ResponseReviewDto } from "src/review/dto/response-review.dto";

export class VendorResponseDto{

    @Expose()
    id: number;

    @Expose()
    shopName: string

    @Expose()
    description: string

    @Expose()
    @Type(() => ProductRequestDto)
    product: ProductRequestDto[]

    @Expose()
    @Type(() => ResponseReviewDto)
    reviews: ResponseReviewDto[]

}