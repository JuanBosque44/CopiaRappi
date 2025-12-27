import { Expose, Type } from "class-transformer";
import { OrderStatus } from "../orders/orders.entity";
import { PaymentResponseDto } from "src/payments/payments/dto/payment-response.dto";
import { ProductRequestDto } from "src/products/entities/dto/product-request.dto";

export class OrderSummaryDto {
    @Expose()
    id: number;

    @Expose()
    status: OrderStatus;

    @Expose()
    totalAmount: number;

    @Expose()
    totalItems: number;

    @Expose()
    @Type(() => ProductRequestDto)
    items: ProductRequestDto[];

    @Expose()
    @Type(() => PaymentResponseDto)
    payments: PaymentResponseDto[];
}