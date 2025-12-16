import { Expose, Type } from "class-transformer";
import { ProductRequestDto } from "src/products/entities/dto/product-request.dto";
import { Review } from "src/review/entities/review.entity";


export class VendorResponseDto{

    @Expose()
    id: number;

    @Expose()
    shopName: string

    @Expose()
    @Type(() => ProductRequestDto)
    product: ProductRequestDto[]

    @Expose()
    @Type(() => Review)
    reviews: Review[]

}