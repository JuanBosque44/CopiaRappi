import { Expose } from "class-transformer";


export class UserFavoriteVendorResponseDto {

    @Expose()
    id: number;

    @Expose()
    shopName: string;
}