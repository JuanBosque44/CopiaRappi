import { Expose } from 'class-transformer';

export class VendorStatisticsDto {

    @Expose()
    totalOrders: number;

    @Expose()
    totalSales: number;

    @Expose()
    completedOrders: number;
}