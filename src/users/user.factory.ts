import { Injectable } from '@nestjs/common';
import { VendorsService } from 'src/vendors/vendors.service';
import { DriversService } from 'src/drivers/drivers.service';
import { BackofficeService } from 'src/backoffice/backoffice.service';
import { CreateVendorDto } from 'src/vendors/entities/dto/create-vendor.dto';
import { CreateDriverDto } from 'src/drivers/entities/dto/create-driver.dto';
import { CreateBackofficeDto } from 'src/backoffice/entities/dto/create-backoffice.dto';
import { UserRole } from './entities/user/user.entity';

@Injectable()
export class UserProfileFactory {
  constructor(
    private readonly vendorsService: VendorsService,
    private readonly driversService: DriversService,
    private readonly backofficeService: BackofficeService,
  ) {}

  async createProfile(role: UserRole, userId: number, profileData: any): Promise<any> {
    switch (role) {
      case UserRole.VENDOR:
        const vendorDto = Object.assign(new CreateVendorDto(), profileData.VendorDto || profileData);
        vendorDto.UserId = userId;
        console.log('Creando perfil de vendedor con los siguientes datos:', vendorDto);
        return await this.vendorsService.create(vendorDto);

      case UserRole.DRIVER:
        const driverDto = Object.assign(new CreateDriverDto(), profileData.DriverDto || profileData);
        driverDto.userId = userId;
        console.log('Creando perfil de conductor con los siguientes datos:', driverDto);
        return await this.driversService.create(driverDto);

      case UserRole.ADMIN:
        const backofficeDto = Object.assign(new CreateBackofficeDto(), profileData);
        backofficeDto.UserId = userId;
        return await this.backofficeService.create(backofficeDto);

      default:
        throw new Error(`Rol no soportado: ${role}`);
    }
  }

  async updateProfile(role: UserRole, userId: number, profileData: any, existingProfileId?: number): Promise<any> {
    switch (role) {
      case UserRole.VENDOR:
        const vendorDto = Object.assign(new CreateVendorDto(), profileData.createVendorDto || profileData);
        vendorDto.UserId = userId;
        if (existingProfileId) {
          await this.vendorsService.update(existingProfileId, vendorDto);
          return await this.vendorsService.findOne(existingProfileId);
        } else {
          return await this.vendorsService.create(vendorDto);
        }

      case UserRole.DRIVER:
        const driverDto = Object.assign(new CreateDriverDto(), profileData);
        driverDto.userId = userId;
        if (existingProfileId) {
          await this.driversService.update(existingProfileId, driverDto);
          return await this.driversService.findOne(existingProfileId);
        } else {
          return await this.driversService.create(driverDto);
        }

      case UserRole.ADMIN:
        const backofficeDto = Object.assign(new CreateBackofficeDto(), profileData);
        backofficeDto.UserId = userId;
        if (existingProfileId) {
          await this.backofficeService.update(existingProfileId, backofficeDto);
          return await this.backofficeService.findOne(existingProfileId);
        } else {
          return await this.backofficeService.create(backofficeDto);
        }

      default:
        throw new Error(`Rol no soportado: ${role}`);
    }
  }
}
