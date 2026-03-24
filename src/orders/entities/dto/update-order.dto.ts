import { PartialType } from "@nestjs/mapped-types";
import { CreateOrdersDto } from "./create-orders.dto";
import { IsEnum, IsOptional } from "class-validator";
import { OrderStatus } from "../orders/orders.entity";
export class UpdateOrderDto extends PartialType(CreateOrdersDto) {
    @IsOptional()
    @IsEnum(OrderStatus)
    status?: OrderStatus;

    @IsOptional()
    driverId?: number;
}