import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IServiceInterface } from 'src/shared/interfaces/service.interface';
import { Order } from './entities/orders/orders.entity';
import { Repository } from 'typeorm';
import { CreateOrdersDto } from './entities/dto/create-orders.dto';
import { UpdateOrderDto } from './entities/dto/update-order.dto';
import { OrderSummaryDto } from './entities/dto/order-summary.dto';
import { UsersService } from 'src/users/users.service';
import { OrderItem } from './entities/orders/order-item.entity';
import { ProductsService } from 'src/products/products.service';
import { OrderStatus } from './entities/orders/orders.entity';
import { PaymentsService } from 'src/payments/payments/payments.service';
import { plainToInstance } from 'class-transformer';
import { PaymentResponseDto } from 'src/payments/payments/dto/payment-response.dto';
import { PaginatedResult } from 'src/shared/interfaces/paginatedResult.type';
import { paginate } from 'src/shared/utils/pagination';
import { Product } from 'src/products/entities/products/products.entity';
import { ProductRequestDto } from 'src/products/entities/dto/product-request.dto';
import { FilterOrderDto } from './entities/dto/filter-order.dto';

@Injectable()
export class OrdersService implements IServiceInterface<Order, CreateOrdersDto, UpdateOrderDto> {
    constructor(
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        @InjectRepository(OrderItem)
        private readonly orderItemRepository: Repository<OrderItem>,
        
        private readonly userService: UsersService,
        private readonly productService: ProductsService,
        @Inject(forwardRef(() => PaymentsService))
        private readonly paymentsService: PaymentsService
    ) {}

    /**
   * @param options Opciones de paginado
   * @param dtoFilter Filtro para las órdenes
   * @returns Listado de órdenes (con o sin paginación/filtro en base a las opciones recibidas)
   */
    findAll(options: {page?: number; limit?: number; [key: string]: any, dtoFilter?: FilterOrderDto} = {} ): Promise<Order[] | PaginatedResult<Order>> {
        const relations = ['items', 'items.product', 'payments', 'payments.method', 'payments.user'];
        

        if(options.limit && options.page) return paginate(this.orderRepository, options.page, options.limit, {relations}, options.dtoFilter ? { ...options.dtoFilter } : {});
        
        let whereOptions = {};
        if(options.dtoFilter) {
            const { vendorId, driverId, status } = options.dtoFilter;
            if(vendorId) whereOptions = { ...whereOptions, vendorId };
            if(driverId) whereOptions = { ...whereOptions, driverId };
            if(status) whereOptions = { ...whereOptions, status };
            if(!whereOptions && options.dtoFilter) whereOptions = { ...whereOptions, ...options.dtoFilter };
        }

        console.log('Where options:', this.orderRepository.find({
            where: { ...whereOptions },
            relations
        })) 
        return this.orderRepository.find({
            where: { ...whereOptions },
            relations
        });
    }

    findOne(id: number): Promise<Order | null> {
        return this.orderRepository.findOne({
            where: { id: id },
            relations: ['user'],
        }) || Promise.reject('Orden no encontrada');
    }

    findAvailableOrders(page: number = 1): Promise<PaginatedResult<Order>> {
        const options = { page, limit: 10 };
        return paginate(this.orderRepository, options.page, options.limit, { relations: ['user'] }, { status: OrderStatus.PENDING, driver: null });
    }


    async create(createOrderDto: CreateOrdersDto): Promise<Order> {
        console.log(createOrderDto)
        const user = await this.userService.findOne(createOrderDto.userId)
        if (!user) throw new NotFoundException('Usuario no encontrado');

        const orderItems: OrderItem[] = [];
        let totalAmount = 0;

        for (const itemDto of createOrderDto.items) {
            console.log(itemDto)
            const product = await this.productService.findOne(itemDto.productId) as Product
            console.log(product)
            if (!product) throw new NotFoundException(`Producto no encontrado`);

            const subtotal = Number(product.price) * itemDto.quantity;
            totalAmount += subtotal;

            const orderItem = this.orderItemRepository.create({
                productId : itemDto.productId,
                quantity: itemDto.quantity,
                price: product.price,
                subtotal,
            });
            const savedItem =  await this.orderItemRepository.save(orderItem);
            orderItems.push(savedItem);
        }


        const order = this.orderRepository.create({
            userId: createOrderDto.userId,
            items: orderItems,
            totalAmount: totalAmount,
            status: OrderStatus.PENDING,
            createdAt: new Date(),
            address: createOrderDto.address || user.address.street,
        });

        const saved = await this.orderRepository.save(order);

        if (createOrderDto.payment) {
            const payDto = {
                orderId: saved.id,
                userId: user.id,
                amount: createOrderDto.payment.amount ?? totalAmount,
                methodId: createOrderDto.payment.methodId,
            };
            await this.paymentsService.create(payDto as any);
        }

        return saved;
    }
    
    //actualiza el estado de la orden y asigna un driver (si se proporciona driverId) aunque elimina el id original y al buscar en el filtro lo hace mal
    update(id: number, body: UpdateOrderDto) : Promise<any> {
        return this.orderRepository.update(id, body);
    }

    delete(id: number) : Promise<any> {
        return this.orderRepository.delete(id);
    }

    async findByUserId(userId: number): Promise<Order[]> {
        const orders = this.orderRepository.find({
            where: { userId },
            relations: ['user'],
        });
        if(!orders) throw new NotFoundException('No se han encontrado ordenes pertenecientes al usuario')
        return orders
    }

    /**
     * Obtiene un resumen de la orden
     * @param id Id de la orden de la que se obtiene un resumen
     */
    async getSummary(id: number) {
        const order = await this.orderRepository.findOne({
            where: { id },
            relations: ['user', 'items', 'items.product', 'payments', 'payments.method', 'payments.user', 'driver'],
        });

        if (!order) throw new NotFoundException('Pedido no encontrado');

        console.log('Pagos:', order.payments?.length ? order.payments : 'Sin pagos asociados');
        const totalItems = order.items.reduce((acc, item) => acc + item.quantity, 0);
        const totalAmount = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0); 

        console.log('Items: ', order.items.length ? order.items : 'Sin items asociados');
        for (const item of order.items) {
            console.log(`Item ${item.id}: Producto ${item.product ? item.product.name : 'No asociado'}`);
            if(!item.product) {

            } 
        }
        const productDto = plainToInstance(
            ProductRequestDto,
            (order.items || []).map(p => ({
                name: p.product.name,
                description: p.product.description,
                price: typeof p.price === 'string' ? parseFloat(p.price as any) : p.price,
                category: p.product.category ? { id: p.product.category.id, name: p.product.category.name } : undefined,
                imageUrl: p.product.imageUrl,
                vendor: p.product.vendor ? { id: p.product.vendor.id, name: p.product.vendor.shopName } : undefined,
                isAvailable: p.product.isActive && p.product.stock > 0,
                quantity: p.quantity,
            }))
        )

        const paymentDtos = plainToInstance(
            PaymentResponseDto,
            (order.payments || []).map(p => ({
                id: p.id,
                status: p.status,
                transactionId: p.transactionId,
                amount: typeof p.amount === 'string' ? parseFloat(p.amount as any) : p.amount,
                createdAt: p.createdAt,
                method: p.method ? { id: p.method.id, name: p.method.name } : undefined,
                user: p.user ? { id: p.user.id, email: p.user.email } : undefined,
            })),
            { excludeExtraneousValues: true },
        );
        const dto = new OrderSummaryDto();
        dto.status = OrderStatus.COMPLETED;
        dto.payments = paymentDtos;
        dto.totalAmount = totalAmount;
        dto.totalItems = totalItems;
        dto.items = productDto;
        return dto;
    }
}
