import { Expose } from "class-transformer";


export class CategoryRequestDto{
    @Expose()
    id: number;

    @Expose()
    name: string;
}