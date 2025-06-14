import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShippingAddress } from './entity/shipping-address.entity';
import { CreateShippingAddressDto } from './model/create-shipping-address.dto';
import { UpdateShippingAddressDto } from './model/update-shipping-address.dto';
import { stringConstants } from '../../utils/string.constant';

@Injectable()
export class ShippingAddressService {
  private readonly logger = new Logger(ShippingAddressService.name);

  constructor(
    @InjectRepository(ShippingAddress)
    private shippingAddressRepository: Repository<ShippingAddress>,
  ) {}

  async findAll() {
    try {
      this.logger.log('Finding all shipping addresses');
      return await this.shippingAddressRepository.find();
    } catch (error) {
      this.logger.error(`Error finding all shipping addresses: ${error.message}`);
      throw error;
    }
  }

  async findById(id: bigint) {
    try {
      this.logger.log(`Finding shipping address with id: ${id}`);
      const shippingAddress = await this.shippingAddressRepository.findOne({
        where: { id }
      });
      
      if (!shippingAddress) {
        throw new NotFoundException(`Shipping address with ID ${id} not found`);
      }
      
      return shippingAddress;
    } catch (error) {
      this.logger.error(`Error finding shipping address by id ${id}: ${error.message}`);
      throw error;
    }
  }

/*   async findByUserId(userId: bigint) {
    try {
      this.logger.log(`Finding shipping addresses for user with id: ${userId}`);
      return await this.shippingAddressRepository.find({
        where: { userId },
        order: { isDefault: 'DESC', createdAt: 'DESC' }
      });
    } catch (error) {
      this.logger.error(`Error finding shipping addresses by user id ${userId}: ${error.message}`);
      throw error;
    }
  } */

  async create(createShippingAddressDto: CreateShippingAddressDto) {
    try {
      this.logger.log('Creating new shipping address');
      const shippingAddress = this.shippingAddressRepository.create(createShippingAddressDto);
      return await this.shippingAddressRepository.save(shippingAddress);
    } catch (error) {
      this.logger.error(`Error creating shipping address: ${error.message}`);
      throw error;
    }
  }

  async update(updateShippingAddressDto: UpdateShippingAddressDto) {
    try {
      this.logger.log(`Updating shipping address with id: ${updateShippingAddressDto.id}`);
      
      const shippingAddress = await this.findById(updateShippingAddressDto.id);
      
      // Update the shipping address with new values
      Object.assign(shippingAddress, updateShippingAddressDto);
      
      return await this.shippingAddressRepository.save(shippingAddress);
    } catch (error) {
      this.logger.error(`Error updating shipping address: ${error.message}`);
      throw error;
    }
  }

/*   async setAsDefault(id: bigint, userId: bigint) {
    try {
      this.logger.log(`Setting shipping address ${id} as default for user ${userId}`);
      
      // Reset all addresses for this user to non-default
      await this.shippingAddressRepository.update(
        { userId, isDefault: true },
        { isDefault: false }
      );
      
      // Set the requested address as default
      const address = await this.findById(id);
      address.isDefault = true;
      
      return await this.shippingAddressRepository.save(address);
    } catch (error) {
      this.logger.error(`Error setting shipping address as default: ${error.message}`);
      throw error;
    }
  } */

  async delete(id: bigint) {
    try {
      this.logger.log(`Deleting shipping address with id: ${id}`);
      const shippingAddress = await this.shippingAddressRepository.findOneBy({ id: id });
      if (!shippingAddress) {
        throw new NotFoundException(`Shipping address with ID ${id} not found`);
      }
      return await this.shippingAddressRepository.softDelete(id.toString());
    } catch (error) {
      this.logger.error(`Error deleting shipping address by id ${id}: ${error.message}`);
      throw error;
    }
  }
}
