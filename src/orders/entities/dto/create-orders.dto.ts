import { IsOptional, IsPositive, IsString, IsInt, IsNumber, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { CreatePaymentDto } from "src/payments/payments/dto/create-payment.dto";

class OrderItemDto {
  @IsNumber()
  productId: number;

  @IsInt()
  @IsPositive()
  quantity: number;
}
 
export class CreateOrdersDto {

    @IsOptional()
    @IsNumber()
    readonly userId: number;   

    @IsNumber()
    @IsPositive({ message: 'El monto total debe ser un número positivo' })
    readonly totalAmount: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];

    @IsOptional()
    @ValidateNested()
    @Type(() => CreatePaymentDto)
    payment?: CreatePaymentDto;

    @IsOptional()
    trackingNumber?: string

    @IsOptional()
    @IsString()
    address: string

}