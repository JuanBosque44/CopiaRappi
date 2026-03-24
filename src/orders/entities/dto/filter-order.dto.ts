import { IsEnum, IsNumber, IsOptional } from 'class-validator';

export class FilterOrderDto {

    @IsOptional()
    @IsNumber()
    vendorId: number;

    @IsOptional()
    @IsNumber()
    driverId: number;

    @IsOptional()
    @IsEnum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    status: string;

}