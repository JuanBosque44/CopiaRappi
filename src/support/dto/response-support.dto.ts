import { Expose } from "class-transformer";


export class ResponseSupportDto {
    @Expose()
    id: number;

    @Expose()
    supportCategory: string;

    @Expose()
    description: string;

    @Expose()
    adminComment: string;

    @Expose()
    status: string;

    @Expose()
    createdAt: Date;
}