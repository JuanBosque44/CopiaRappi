import { Expose, Type } from 'class-transformer';
import { OrderSummaryDto } from 'src/orders/entities/dto/order-summary.dto';

export class DriverOrdersResponseDto {
    @Expose()
    id: number;

    @Expose()
    @Type(() => OrderSummaryDto)
    orders: OrderSummaryDto[];

    @Expose()
    totalOrders: number;

    @Expose()
    date: Date;
}