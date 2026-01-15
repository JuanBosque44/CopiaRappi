import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor } from './entities/vendors/vendors.entity';
import { Product } from 'src/products/entities/products/products.entity';
import { CreateVendorDto } from './entities/dto/create-vendor.dto';
import { UpdateVendorDto } from './entities/dto/update-vendor.dto';
import { IServiceInterface } from 'src/shared/interfaces/service.interface';
import { PaginatedResult } from 'src/shared/interfaces/paginatedResult.type';
import { paginate } from 'src/shared/utils/pagination';
import { VendorResponseDto } from './entities/dto/vendor-response.dto';
import { plainToInstance } from 'class-transformer';
import { VendorStatisticsDto } from './entities/dto/vendor-statistics.dto';

@Injectable()
export class VendorsService implements IServiceInterface <Vendor, CreateVendorDto, UpdateVendorDto, VendorResponseDto> {
  constructor(
    @InjectRepository(Vendor)
    private readonly vendorsRepository: Repository<Vendor>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  /**
   * 
   * @param options Opciones de paginado (opcional)
   * @returns Listado completo de los restaurantes (con o sin paginación en base a los parámetros recibidos) que muestran sus reseñas y productos
   */
  async findAll(options: {page?: number; limit?: number; [key: string]: any} = {} ): Promise<Vendor[] | PaginatedResult<Vendor> | VendorResponseDto[] | PaginatedResult<VendorResponseDto>> {
    const relations = ['reviews', 'products'];

    if (options.page && options.limit) {
      return paginate(this.vendorsRepository, options.page, options.limit, { relations });
    }

    if(options.page && options.limit) {
      const paginated = await paginate(this.vendorsRepository, options.page, options.limit, {relations})
      return {
        ...paginated,
        data: plainToInstance(VendorResponseDto, paginated.data, {excludeExtraneousValues: true})
      }
    }

    const vendor = await this.vendorsRepository.find({relations});

    return plainToInstance(VendorResponseDto, vendor, { excludeExtraneousValues: true})
  }

  /**  Obtener un vendor por id con sus productos y reviews.
   * @param id vendorProfileId del user (id del tipo de usuario vendor).*/ 
  async findOne(id: number): Promise<Vendor> {
    const vendor = await this.vendorsRepository.findOne({
      where: { id },
      relations: ['products', 'reviews'],
    });
    if (!vendor) {
      throw new NotFoundException(`Vendedor con id ${id} no encontrado`);
    }
    return vendor;
  }

  /**
   * Crea una nueva instancia de vendor asignado a un usuario.
   * @param dto recibe un DTO con los datos del vendor (shopName, description).
   * @returns Instancia de vendor perteneciente a un usuario (user).
   */
  async create(dto: CreateVendorDto): Promise<Vendor> {
      try {
        const vendor = this.vendorsRepository.create(dto);
        return await this.vendorsRepository.save(vendor);
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.log(error.message);
        } else {
          console.log('Error desconocido', error);
        }
        throw new InternalServerErrorException(
          'Error al crear el vendor: '+ error
        );
      }
  }

  async update(id: number, dto: UpdateVendorDto): Promise<Vendor> {
    const vendor = await this.findOne(id);
    Object.assign(vendor, dto);
    return this.vendorsRepository.save(vendor);
  }

  async delete(id: number): Promise<void> {
    const vendor = await this.findOne(id);
    await this.vendorsRepository.remove(vendor);
  }

  /**
   * Busca un restaurante por el nombre, no busca reseñas ni productos del mismo.
   * @param nombre nombre del restaurante (vendor) recibido desde el front.
   * @returns el restaurante que tiene el nombre recibido o null en caso de no coincidir.
   */
  async findByVendorName(nombre: string): Promise<Vendor[]> {
    return this.vendorsRepository
      .createQueryBuilder('vendor')
      .where('vendor.shopName = :nombre', { nombre })
      .getMany();
  }

  /**
   * 
   * @param vendorId Id del vendor que se usará como filtro para buscar sus productos.
   * @returns Listado de productos.
   */
  async getProducts(vendorId: number): Promise<Product[]> {
    return this.productRepository.find({ where: { vendor: { id: vendorId } } });
  }

  /**
   * 
   * @param vendorId Id del vendor que se usará como filtro para buscar sus productos y órdenes.
   * @returns  DTO que contiene estadisticas de las ordenes: cantidad, ganancias y completadas.
   */
  async getStatistics(vendorId: number) {
    const vendor = await this.vendorsRepository.findOne({
      where: { id: vendorId },
      relations: ['products', 'orders'],
    });
    if (!vendor) {
      throw new NotFoundException(`Vendedor con id ${vendorId} no encontrado`);
    }
    let vendorStatisticsDto = new VendorStatisticsDto();
    Object.assign(vendorStatisticsDto, {
      totalOrders: vendor.orders.length,
      totalSales: vendor.orders.reduce((total, order) => total + order.totalAmount, 0),
      completedOrders: vendor.orders.filter(order => order.status === 'COMPLETED').length,
    });
    console.log(vendorStatisticsDto);
    return vendorStatisticsDto;
  }
}
