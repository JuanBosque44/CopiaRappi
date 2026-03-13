import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user/user.entity';
import { IServiceInterface } from 'src/shared/interfaces/service.interface';
import { CreateUserDto } from './entities/dto/create-user.dto';
import { Address } from './entities/user/address.entity';
import { UpdateUserDto } from './entities/dto/update-user.dto';
import { UserRole } from './entities/user/user.entity';
import { VendorsService } from 'src/vendors/vendors.service';
import { ClientDataDto } from './entities/dto/client-data.dto';
import * as bcrypt from 'bcryptjs';
import { PaginatedResult } from 'src/shared/interfaces/paginatedResult.type';
import { paginate } from 'src/shared/utils/pagination';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from './entities/dto/user-response.dto';
import { UserFavoriteVendorResponseDto } from './entities/dto/user-favoriteVendor-response.dto';
import { validateEmail } from 'src/shared/utils/email-validation';
import { UserProfileFactory } from './user.factory';

@Injectable()
export class UsersService implements IServiceInterface<User, CreateUserDto, UpdateUserDto, UserResponseDto> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    private readonly vendorsService: VendorsService,
    private readonly userProfileFactory: UserProfileFactory,
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

  async findClient(clientData: ClientDataDto): Promise<UserFavoriteVendorResponseDto[] | null> {
    const user = await this.userRepository.findOne({
        where: { id: clientData.id, role: clientData.role },
        relations: ['address', 'favoriteVendors', 'reviews'],
    });
    if(!user) throw new NotFoundException('No se ha encontrado al cliente')
    let userFavoriteVendors = new Array<UserFavoriteVendorResponseDto>();
    for (const vendor of (await user).favoriteVendors) {
      const userFavoriteVendor = new UserFavoriteVendorResponseDto();
      userFavoriteVendor.id = vendor.id;
      userFavoriteVendor.shopName = vendor.shopName;
      userFavoriteVendors.push(userFavoriteVendor);
    }
    return userFavoriteVendors;
  }

  async findByEmail(email: string) {
      validateEmail(email.toLowerCase()) === false && (() => { throw new BadRequestException('El email ingresado no es válido') })();
      const user = await this.userRepository.findOne({
        where: { email: email.toLowerCase() },
      });
      return user

  }
        
  async create(data: CreateUserDto): Promise<UserResponseDto> {
    try {
        let address: Address | undefined;
        let emailLower = data.email.toLowerCase();
        let savedEntity;

        const validEmail = await this.findByEmail(emailLower)
        if(validateEmail(emailLower) === false) throw new BadRequestException('El email ingresado no es válido')
        if(validEmail) throw new UnauthorizedException('No se puede crear un usuario con el email ingresado')
        

    if (data.address) {
      this.addressInsert(data.address.street)
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
      
      if (savedUser.role === UserRole.VENDOR && vendorProfile) {
          savedEntity = await this.userProfileFactory.createProfile(savedUser.role, savedUser.id, vendorProfile);
          savedUser.vendorProfile = savedEntity;
          savedUser.vendorProfileId = savedEntity.id;
      } else if (savedUser.role === UserRole.DRIVER && driverProfile) {
          savedEntity = await this.userProfileFactory.createProfile(savedUser.role, savedUser.id, driverProfile);
          savedUser.driverProfile = savedEntity;
          savedUser.driverProfileId = savedEntity.id;
      } else if (savedUser.role === UserRole.ADMIN && backOfficeProfile) {
          savedEntity = await this.userProfileFactory.createProfile(savedUser.role, savedUser.id, backOfficeProfile);
          savedUser.backOfficeProfile = savedEntity;
          savedUser.backOfficeProfileId = savedEntity.id;
      }
      await this.userRepository.save(savedUser);

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

  async update(id: number, body: UpdateUserDto): Promise<User> {
    const { driverProfile, vendorProfile, backOffice, password, ...rest } = body as any;

    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['driverProfile', 'vendorProfile', 'backOfficeProfile', 'address'],
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Si se ha enviado una nueva contraseña, la hasheamos antes de guardarla
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);  
      user.password = hashedPassword;  
    }

    validateEmail(user.email.toLowerCase()) === false && (() => { throw new BadRequestException('El email ingresado no es válido') })();

    Object.assign(user, rest);
    if (rest.address) {
      const newAddress = await this.addressInsert(rest.address)
      user.address = newAddress;
      user.addressId = newAddress.id;
    }

    if (vendorProfile) {
      user.vendorProfile = await this.userProfileFactory.updateProfile(user.role, user.id, vendorProfile, user.vendorProfileId);
    }
    if (driverProfile) {
      user.driverProfile = await this.userProfileFactory.updateProfile(user.role, user.id, driverProfile, user.driverProfileId);
    }
    if (backOffice) {
      user.backOfficeProfile = await this.userProfileFactory.updateProfile(user.role, user.id, backOffice, user.backOfficeProfileId);
    }

    await this.userRepository.save(user);
    return user;
  }

/**
 * Permite a los clientes asignar restaurantes como favoritos
 * @param userId Id del cliente que marca un favorito
 * @param vendorId Id del restaurante (vendor) marcado
 * @returns false si no estaba asignado como favorito y se agregó, true si estaba asignado y fue eliminada la relación
 */
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

  /**
   * Inserta direcciones nuevas en la BD evitando repeticiones
   * @param address Dirección recibida del front
   * @returns dirección guardada o recibida en caso de que ya existiera
   */
  private async addressInsert(address: string) {
    address = address.trim()
    let newAddress = await this.addressRepository.findOne({ where: { street: address } });
    if (!newAddress) {
      newAddress = new Address();
      newAddress.street = address;
      const createdAddress = this.addressRepository.create(newAddress)
      newAddress = await this.addressRepository.save(createdAddress);
    }
    return newAddress
  }

}
