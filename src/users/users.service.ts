import { Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user/user.entity';
import { IServiceInterface } from 'src/shared/interfaces/service.interface';
import { CreateUserDto } from './entities/dto/create-user.dto';
import { Address } from './entities/user/address.entity';
import { UpdateUserDto } from './entities/dto/update-user.dto';
import { UserRole } from './entities/user/user.entity';
import { VendorsService } from 'src/vendors/vendors.service';
import { CreateVendorDto } from 'src/vendors/entities/dto/create-vendor.dto';
import { CreateDriverDto } from 'src/drivers/entities/dto/create-driver.dto';
import { DriversService } from 'src/drivers/drivers.service';
import { BackofficeService } from 'src/backoffice/backoffice.service';
import { CreateBackofficeDto } from 'src/backoffice/entities/dto/create-backoffice.dto';
import { ClientDataDto } from './entities/dto/client-data.dto';
import * as bcrypt from 'bcryptjs';
import { PaginatedResult } from 'src/shared/interfaces/paginatedResult.type';
import { paginate } from 'src/shared/utils/pagination';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from './entities/dto/user-response.dto';

@Injectable()
export class UsersService implements IServiceInterface<User, CreateUserDto, UpdateUserDto, UserResponseDto> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    private readonly vendorsService: VendorsService,
    private readonly driversService: DriversService,
    private readonly backofficeService: BackofficeService,
  ) {}

  async findAll(options: { page?: number; limit?: number; [key: string]: any } = {}): Promise<User[] | PaginatedResult<User>> {
    const relations = ['address'];
    const page = options.page ? Number(options.page) : undefined;
    const limit = options.limit ? Number(options.limit) : undefined;

    if (page && limit) {
      return paginate(this.userRepository, page, limit, { relations });
    }

    return this.userRepository.find({ relations });
  }

  findAddress(): Promise<Address[]> {
    return this.addressRepository.find();
  }

  async findOne(id: number): Promise<User | null> {
      const user = await this.userRepository.findOne({
          where: { id: id },
          relations: ['vendorProfile', 'driverProfile', 'backOfficeProfile', 'address', 'orders', 'supportRequest'],
      });
      if (!user) throw new NotFoundException('No se ha encontrado al usuario')
      return user;
  }

  findClient(clientData: ClientDataDto): Promise<User | null> {
    const user = this.userRepository.findOne({
        where: { id: clientData.id, role: clientData.role },
        relations: ['address', 'favoriteVendors', 'reviews'],
    });
    if(!user) throw new NotFoundException('No se ha encontrado al cliente')
    return user
  }

  async findByEmail(email: string) {
      const user = await this.userRepository.findOne({
          where: { email: email },
      });
      return user

  }
        
  async create(data: CreateUserDto): Promise<UserResponseDto> {
      try {
          let address: Address | undefined;
          let emailLower = data.email.toLowerCase();
          let savedEntity;
          let dto;

          const validEmail = await this.findByEmail(emailLower)
          if(validEmail) throw new UnauthorizedException('No se puede crear un usuario con el email ingresado')

    if (data.address) {
      address = this.addressRepository.create(data.address);
      await this.addressRepository.save(address);
    }

    const { vendorProfile, backOffice: backOfficeProfile, driverProfile, password, ...restData } = data;
    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    const user = this.userRepository.create({
      ...restData,
      email: emailLower,
      password: hashedPassword,
      address,
    });

      const savedUser = await this.userRepository.save(user);
      
      //verificar si se puede refactorizar el siguiente codigo, ya que es repetitivo.
      if (savedUser.role === UserRole.VENDOR && vendorProfile) {
          dto = new CreateVendorDto();
          dto = vendorProfile.VendorDto;
          dto.UserId = savedUser.id;
          console.log('Creando perfil de vendedor con los siguientes datos:', dto);
          savedEntity = await this.vendorsService.create(dto);

          savedUser.vendorProfile = savedEntity;
          savedUser.vendorProfileId = savedEntity.id;
          await this.userRepository.save(savedUser);
      }
      else if (savedUser.role === UserRole.DRIVER && driverProfile) {
      //Puede recibir el dto como objeto o un objeto que tenga las mismas caracteristicas
      console.log('Driver: '+driverProfile)
      if ((driverProfile as any).createDriverDto) {
          dto = (driverProfile as any).createDriverDto as CreateDriverDto;
      } else {
          dto = Object.assign(new CreateDriverDto(), driverProfile as unknown as Partial<CreateDriverDto>);
      }
      (dto as any).userId = savedUser.id;
      console.log('Creando perfil de conductor con los siguientes datos:', dto);
      const savedEntity = await this.driversService.create(dto);
      savedUser.driverProfile = savedEntity;
      savedUser.driverProfileId = savedEntity.id;
      await this.userRepository.save(savedUser);
    } else if (savedUser.role === UserRole.ADMIN) {
      if (backOfficeProfile) {
        const dto = Object.assign(new CreateBackofficeDto(), backOfficeProfile as unknown as Partial<CreateBackofficeDto>);
        dto.UserId = savedUser.id;
        const savedEntity = await this.backofficeService.create(dto);

        savedUser.backOfficeProfile = savedEntity;
        savedUser.backOfficeProfileId = savedEntity.id;
        await this.userRepository.save(savedUser);
      }
    }

    return plainToInstance(UserResponseDto, savedUser, { excludeExtraneousValues: true });

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error al crear el usuario:', error.message);
    } else {
      console.error('Error desconocido al crear el usuario:', error);
    }

    throw new InternalServerErrorException('Error al crear el usuario. Por favor, inténtalo de nuevo más tarde.');
  }
}

  // Método para actualizar usuario
async update(id: number, body: UpdateUserDto): Promise<User> {
  const { driverProfile, vendorProfile, backOffice, password, ...rest } = body as any;

  const user = await this.userRepository.findOne({
    where: { id },
    relations: ['driverProfile', 'vendorProfile', 'backOfficeProfile', 'address'],
  });

  if (!user) throw new NotFoundException('Usuario no encontrado');

  // Si se ha enviado una nueva contraseña, la hasheamos antes de guardarla
  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);  // Hashing de la nueva contraseña
    user.password = hashedPassword;  // Actualizamos la contraseña del usuario
  }

  // Actualizamos el resto de los datos del usuario
  Object.assign(user, rest);

  // Si hay un nuevo addressId, buscamos la nueva dirección y la asignamos
  if (rest.addressId) {
    const newAddress = await this.addressRepository.findOne({ where: { id: rest.addressId } });
    if (!newAddress) throw new NotFoundException('Dirección no encontrada');
    user.address = newAddress;
    user.addressId = newAddress.id;
  }

  // Si hay un perfil de vendedor, lo actualizamos
  if (vendorProfile) {
    let dtoV: CreateVendorDto;
    if ((vendorProfile as any).createVendorDto) {
      dtoV = (vendorProfile as any).createVendorDto as CreateVendorDto;
    } else {
      dtoV = Object.assign(new CreateVendorDto(), vendorProfile as unknown as Partial<CreateVendorDto>);
    }
    dtoV.UserId = user.id;

    if (user.vendorProfileId) {
      await this.vendorsService.update(user.vendorProfileId, dtoV);
      user.vendorProfile = await this.vendorsService.findOne(user.vendorProfileId);
    } else {
      const createdV = await this.vendorsService.create(dtoV);
      user.vendorProfile = createdV;
      user.vendorProfileId = createdV.id;
    }
  }

  // Si hay un perfil de conductor, lo actualizamos
  if (driverProfile) {
    let dtoD: CreateDriverDto = Object.assign(new CreateDriverDto(), driverProfile as unknown as Partial<CreateDriverDto>);
    (dtoD as any).userId = user.id;
    if (user.driverProfileId) {
      await this.driversService.update(user.driverProfileId, dtoD);
      user.driverProfile = await this.driversService.findOne(user.driverProfileId);
    } else {
      const createdD = await this.driversService.create(dtoD);
      user.driverProfile = createdD;
      user.driverProfileId = createdD.id;
    }
  }

  // Si hay un perfil de backoffice, lo actualizamos
  if (backOffice) {
    let dtoB: CreateBackofficeDto = Object.assign(new CreateBackofficeDto(), backOffice as unknown as Partial<CreateBackofficeDto>);
    dtoB.UserId = user.id;
    if (user.backOfficeProfileId) {
      await this.backofficeService.update(user.backOfficeProfileId, dtoB);
      user.backOfficeProfile = await this.backofficeService.findOne(user.backOfficeProfileId);
    } else {
      const createdB = await this.backofficeService.create(dtoB);
      user.backOfficeProfile = createdB;
      user.backOfficeProfileId = createdB.id;
    }
  }

  // Guardamos el usuario actualizado
  await this.userRepository.save(user);
  return user;
}

// Método para agregar o eliminar un restaurante favorito
async toggleFavoriteVendor(userId: number, vendorId: number) {
  const user = await this.userRepository.findOne({
    where: { id: userId },
    relations: ['favoriteVendors'],
  });

  if (!user) throw new NotFoundException('Usuario no encontrado');

  const vendor = await this.vendorsService.findOne(vendorId);
  if (!vendor) throw new NotFoundException('Restaurante no encontrado');

  const isFavorite = user.favoriteVendors.some(v => v.id === Number(vendorId));

  if (isFavorite) {
    await this.userRepository
      .createQueryBuilder()
      .relation(User, 'favoriteVendors')
      .of(user)
      .remove(vendor);
  } else {
    await this.userRepository
      .createQueryBuilder()
      .relation(User, 'favoriteVendors')
      .of(user)
      .add(vendor);
  }

  return isFavorite
}

  async delete(id: number): Promise<any> {
      const user = await this.findOne(id)
      if(!user) throw new NotFoundException('No se encontro el usuario a eliminar')
      return this.userRepository.delete(id);
  }

}
