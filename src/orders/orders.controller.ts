import { Body, Controller, Delete, Get, InternalServerErrorException, Param, Patch, Post, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrdersDto } from './entities/dto/create-orders.dto';
import { UpdateOrderDto } from './entities/dto/update-order.dto';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/users/entities/user/user.entity';
import { validateParameters } from 'src/shared/utils/parameters-validation';
import { FilterOrderDto } from './entities/dto/filter-order.dto';

@Controller('orders')
export class OrdersController {
    constructor(
        private readonly ordersService: OrdersService
    ) {}

    @Get()
    @Roles(UserRole.ADMIN, UserRole.CLIENT, UserRole.VENDOR, UserRole.DRIVER)
    findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('vendorId') vendorId?: string, @Query('driverId') driverId?: string, @Query('status') status?: string) {
        if(!validateParameters(page, limit, vendorId)) throw new InternalServerErrorException('Parametros inválidos')

        const options: any = {};
		if (page) options.page = Number(page);
		if (limit) options.limit = Number(limit);

        const dtoFilter = new FilterOrderDto();
        if (vendorId) dtoFilter.vendorId = Number(vendorId);
        if (driverId) dtoFilter.driverId = Number(driverId);
        if (status) dtoFilter.status = status;

        options.dtoFilter = dtoFilter;

        return this.ordersService.findAll(Object.keys(options).length ? options : {});
    }

    @Get('available')
    @Roles(UserRole.DRIVER)
    findAvailableOrders(@Query('page') page?: string) {
        return this.ordersService.findAvailableOrders(page ? Number(page) : 1);
    }

    @Post()
    @Roles(UserRole.CLIENT)
    create(@Body() body: CreateOrdersDto) {
        console.log(body)
        return this.ordersService.create(body);
    }

    @Patch(':id')
    @Roles(UserRole.CLIENT, UserRole.ADMIN, UserRole.VENDOR, UserRole.DRIVER)
    update(@Param('id') id: string, @Body() body: UpdateOrderDto) {
        if(!validateParameters(id)) throw new InternalServerErrorException('Parametros inválidos')
        return this.ordersService.update(+id, body);
    }

    @Delete(':id')
    delete(@Param('id') id: string) {
        if(!validateParameters(id)) throw new InternalServerErrorException('Parametros inválidos')
        return this.ordersService.delete(+id);
    }

    @Get(':id/summary')
    @Roles(UserRole.CLIENT, UserRole.VENDOR)
    async getOrderSummary(@Param('id') id: number) {
        if(!validateParameters(id)) throw new InternalServerErrorException('Parametros inválidos')
        const order = await this.ordersService.getSummary(id);
        return order? order : 'No se ha encontrado el pedido.'
    }

}
