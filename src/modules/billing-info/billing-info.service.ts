import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillingInfo } from './entity/billing-info.entity';
import { CreateBillingInfoDto } from './model/create-billing-info.dto';
import { UpdateBillingInfoDto } from './model/update-billing-info.dto';
import { stringConstants } from '../../utils/string.constant';
import { NotFoundCustomException, NotFoundCustomExceptionType } from 'src/common/exceptions/types/notFound.exception';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';

export enum RepositoryType {
  BILLING_INFO = 'billingInfoRepository',
  BILL = 'billRepository',
  USER = 'userRepository',
  BRAND = 'brandRepository',
  CATEGORY = 'categoryRepository',
  PRODUCT = 'productRepository',
  SPARE_PART = 'sparePartRepository',
  MEDIA = 'mediaRepository',
  LANDING = 'landingRepository',
  BRAND_CATEGORY = 'brandCategoryRepository'
}

@Injectable()
export class BillingInfoService {
  private readonly logger = new Logger(BillingInfoService.name);

  constructor(
    @InjectRepository(BillingInfo)
    private billingInfoRepository: Repository<BillingInfo>,
  ) {}

  async findAll() {
    try {
      this.logger.log('Finding all billing information');
      return await this.billingInfoRepository.find();
    } catch (error) {
      this.logger.error(`Error finding all billing information: ${error.message}`);
      throw error;
    }
  }

  async findById(id: bigint) {
    try {
      this.logger.log(`Finding billing info with id: ${id}`);
      const billingInfo = await this.billingInfoRepository.findOne({
        where: { id }
      });
      
      if (!billingInfo) {
        throw new NotFoundException(`Billing info with ID ${id} not found`);
      }
      
      return billingInfo;
    } catch (error) {
      this.logger.error(`Error finding billing info by id ${id}: ${error.message}`);
      throw error;
    }
  }

  async findByUserId(userId: bigint) {
    try {
      this.logger.log(`Finding billing info for user with id: ${userId}`);
      return await this.billingInfoRepository.find({
        where: { userId },
        order: { isDefault: 'DESC', createdAt: 'DESC' }
      });
    } catch (error) {
      this.logger.error(`Error finding billing info by user id ${userId}: ${error.message}`);
      throw error;
    }
  }

  async create(createBillingInfoDto: CreateBillingInfoDto) {
    try {
      this.logger.log('Creating new billing info');
      const billingInfo = this.billingInfoRepository.create(createBillingInfoDto);
      return await this.billingInfoRepository.save(billingInfo);
    } catch (error) {
      this.logger.error(`Error creating billing info: ${error.message}`);
      throw error;
    }
  }

  async update(updateBillingInfoDto: UpdateBillingInfoDto) {
    try {
      this.logger.log(`Updating billing info with id: ${updateBillingInfoDto.id}`);
      
      const billingInfo = await this.findById(updateBillingInfoDto.id);
      
      // Update the billing info with new values
      Object.assign(billingInfo, updateBillingInfoDto);
      
      return await this.billingInfoRepository.save(billingInfo);
    } catch (error) {
      this.logger.error(`Error updating billing info: ${error.message}`);
      throw error;
    }
  }

  async setAsDefault(id: bigint, userId: bigint) {
    try {
      this.logger.log(`Setting billing info ${id} as default for user ${userId}`);
      
      // Reset all billing info for this user to non-default
      await this.billingInfoRepository.update(
        { userId, isDefault: true },
        { isDefault: false }
      );
      
      // Set the requested billing info as default
      const billingInfo = await this.findById(id);
      billingInfo.isDefault = true;
      
      return await this.billingInfoRepository.save(billingInfo);
    } catch (error) {
      this.logger.error(`Error setting billing info as default: ${error.message}`);
      throw error;
    }
  }
  
  async delete(id: bigint) {
    try {
      const billingInfo = await this.billingInfoRepository.findOneBy({ id: id });
      if (!billingInfo) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.BILL);
      }
      return await this.billingInfoRepository.softDelete(id.toString());
    } catch (exception) {
      HandleException.exception(exception);
    }
  }
}
