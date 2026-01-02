import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver, DriverStatus } from './entities/drivers/driver.entity';
import { CreateDriverDto } from './entities/dto/create-driver.dto';
import { UpdateDriverDto } from './entities/dto/update-driver.dto';
import { UpdateDriverLocationDto } from './entities/dto/update-driver-location.dto';
import { IServiceInterface } from 'src/shared/interfaces/service.interface';
import { PaginatedResult } from 'src/shared/interfaces/paginatedResult.type';
import { FindDriverDto } from './entities/dto/find-driver.dto';
import { paginate } from 'src/shared/utils/pagination';
import { DriverOrdersResponseDto } from './entities/dto/driver-orders-response.dto';
import { OrderSummaryDto } from 'src/orders/entities/dto/order-summary.dto';


@Injectable()
export class DriversService implements IServiceInterface<Driver, CreateDriverDto, UpdateDriverDto> {
  
  constructor(
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
  ) {}


  async findAll(options: {page?: number; limit?: number; [key: string]: any} = {}, dtoFilter?: FindDriverDto ): Promise<Driver[] | PaginatedResult<Driver>> {
    try {
      if(options.limit && options.page){
        return paginate(this.driverRepository, options.page, options.limit, { relations: ['orders'] }, dtoFilter);
      }

      if(dtoFilter?.status) return this.driverRepository.findBy({status: dtoFilter.status})
      if(dtoFilter?.isActive) return this.driverRepository.findBy({isActive: dtoFilter.isActive})

      return this.driverRepository.find()

    } catch (error) {
      throw new InternalServerErrorException('Error al obtener los drivers: '+ error);
    }
  }

  /**
   * 
   * @param id recibe el id del perfil de driver
   * @returns informacion del perfil del driver y sus relaciones con su usuario y ordenes
   */
  async findOne(id: number): Promise<Driver> {
    const driver = await this.driverRepository.findOne({
      where: { id },
      relations: ['user', 'orders'], 
    });

    if (!driver) {
      throw new NotFoundException(`No se ha encontrado el repartidor.`);
    }

    return driver;
  }

  async create(createDriverDto: CreateDriverDto): Promise<Driver> {
    try {
      if (createDriverDto.licensePlate) {
        const existingDriver = await this.driverRepository.findOne({
          where: { licensePlate: createDriverDto.licensePlate },
        });

        if (existingDriver) {
          throw new BadRequestException(
            `Ya existe un driver con la licencia ${createDriverDto.licensePlate}`
          );
        }
      }

      const driver = this.driverRepository.create({
        ...createDriverDto,
        status: DriverStatus.OFFLINE, 
        documentsVerified: false, 
        isActive: true, 
        rating: 5.0, 
        totalDeliveries: 0,
        totalEarnings: 0,
      });

      const savedDriver = await this.driverRepository.save(driver);

      return savedDriver;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al crear el driver: ' + error);
    }
  }
  
  /**
   * 
   * @param id id del perfil de driver o driverProfileId
   * @param updateDriverDto datos a modificar, no es necesario que se complete todo el dto para que funcione
   * @returns 
   */
  async update(id: number, updateDriverDto: UpdateDriverDto): Promise<Driver> {
    try {
      const driver = await this.findOne(id);

      if (updateDriverDto.licensePlate && updateDriverDto.licensePlate !== driver.licensePlate) {
        const existingDriver = await this.driverRepository.findOne({
          where: { licensePlate: updateDriverDto.licensePlate },
        });

        if (existingDriver) {
          throw new BadRequestException(
            `La patente ${updateDriverDto.licensePlate} ya está en uso`
          );
        }
      }

      Object.assign(driver, updateDriverDto);

      const updatedDriver = await this.driverRepository.save(driver);

      return updatedDriver;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error.cause;
      }
      else{
        throw new InternalServerErrorException('Error al actualizar el driver: '+ error);
      }
    }
  }

  async updateStatus(id: number, status: DriverStatus): Promise<Driver> {
    const driver = await this.findOne(id);
    if(!driver) throw new NotFoundException('No se ha encontrado este repartidor.')
    driver.status = status;
    return await this.driverRepository.save(driver);
  }

 
  async toggleActive(id: number, isActive: boolean): Promise<Driver> {
    const driver = await this.findOne(id);
    if(!driver) throw new NotFoundException('No se ha encontrado este repartidor.')
    driver.isActive = isActive;
    
    if (!isActive) {
      driver.status = DriverStatus.OFFLINE;
    }
    
    return await this.driverRepository.save(driver);
  }
  
  async verifyDocuments(id: number): Promise<Driver> {
    const driver = await this.findOne(id);
    driver.documentsVerified = true;
    return await this.driverRepository.save(driver);
  }

  async updateLocation(
    id: number, 
    locationDto: UpdateDriverLocationDto
  ): Promise<Driver> {
    const driver = await this.findOne(id);
    
    driver.currentLatitude = locationDto.latitude;
    driver.currentLongitude = locationDto.longitude;
    driver.lastLocationUpdate = new Date();
    
    return await this.driverRepository.save(driver);
  }

  async findNearbyAvailable(
    latitude: number,
    longitude: number,
    radiusKm: number = 5
  ): Promise<Driver[]> {
    //  Fórmula de Haversine en SQL para calcular distancia
    const drivers = await this.driverRepository
      .createQueryBuilder('driver')
      .where('driver.status = :status', { status: DriverStatus.AVAILABLE })
      .andWhere('driver.isActive = :isActive', { isActive: true })
      .andWhere('driver.documentsVerified = :verified', { verified: true })
      .andWhere('driver.currentLatitude IS NOT NULL')
      .andWhere('driver.currentLongitude IS NOT NULL')
      .andWhere(
        `(
          6371 * acos(
            cos(radians(:lat)) * 
            cos(radians(driver.currentLatitude)) * 
            cos(radians(driver.currentLongitude) - radians(:lng)) + 
            sin(radians(:lat)) * 
            sin(radians(driver.currentLatitude))
          )
        ) <= :radius`,
        { lat: latitude, lng: longitude, radius: radiusKm }
      )
      .orderBy('driver.rating', 'DESC') // Ordenar por mejor rating
      .getMany();

    return drivers;
  }

  async getStatistics(id: number) {
    const driver = await this.findOne(id);
    
    return {
      id: driver.id,
      rating: driver.rating,
      totalDeliveries: driver.totalDeliveries,
      totalEarnings: driver.totalEarnings,
      status: driver.status,
      isActive: driver.isActive,
      documentsVerified: driver.documentsVerified,
      vehicleInfo: {
        type: driver.vehicleType,
        plate: driver.licensePlate,
        brand: driver.vehicleBrand,
        model: driver.vehicleModel,
        year: driver.vehicleYear,
      },
    };
  }

  async getDriverOrders(id: number) {
    const driver = await this.findOne(id);
    if(!driver) throw new NotFoundException('No se ha encontrado el repartidor.')
    const ordersDto = new DriverOrdersResponseDto();
    const orderSummary = new OrderSummaryDto();
    const allOrders = new Array<OrderSummaryDto>();
    driver.orders.forEach(order => {
      Object.assign(orderSummary, {
        id: 0,
        totalAmount: order.totalAmount,
        status: order.status,
        payments: order.payments,
        items: order.items,
        totalItems: order.items.length,
      });
      allOrders.push(orderSummary);
    });
    Object.assign(ordersDto, {
      id: driver.id,
      orders: allOrders,
      totalOrders: driver.orders.length,
      date: driver.orders.length > 0 ? driver.orders[0].createdAt : null,
    });
    console.log(ordersDto);
    return ordersDto;  
  }

  async delete(id: number): Promise<void> {
    const driver = await this.findOne(id);
    if(!driver) throw new NotFoundException('No se ha encontrado el repartidor a eliminar.')
    await this.driverRepository.remove(driver);
  }

  async softRemove(id: number): Promise<Driver> {
    return await this.toggleActive(id, false);
  }
}
