import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './entity/brand.entity';
import { CreateBrandDto } from './model/create.brand.dto';
import { UpdateBrandDto } from './model/update.brand.dto';
import { stringConstants } from '../../utils/string.constant';
import { BrandCategoryService } from '../brand-category/brand-category.service';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from '../../common/exceptions/types/notFound.exception';
import { HandleException } from '../../common/exceptions/handler/handle.exception';

@Injectable()
export class BrandService {
  constructor(
    @InjectRepository(Brand)
    private brandRepository: Repository<Brand>,
    private brandCategoryService: BrandCategoryService,
  ) {}

  // Método reutilizable
  private buildBrandQueryBuilder() {
    return this.brandRepository
      .createQueryBuilder('brand')
      .leftJoinAndSelect('brand.brandCategories', 'brandCategory')
      .leftJoinAndSelect('brandCategory.category', 'category');
  }

  async findAll() {
    try {
      return await this.buildBrandQueryBuilder().getMany();
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async findAllActive() {
    try {
      return await this.buildBrandQueryBuilder()
        .where('brand.status = :status', { status: stringConstants.STATUS_ACTIVE })
        .getMany();
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async findById(id: bigint) {
    try {
      const brand = await this.buildBrandQueryBuilder()
        .where('brand.id = :id', { id })
        .getOne();

      if (!brand) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.BRAND);
      }

      return brand;
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async create(createBrandDto: CreateBrandDto) {
    try {
      const brand = this.brandRepository.create(createBrandDto);
      const savedBrand = await this.brandRepository.save(brand);

      if (createBrandDto.categoryIds) {
        await this.brandCategoryService.bulkCreate(
          createBrandDto.categoryIds.map(id => ({
            brandId: savedBrand.id,
            categoryId: BigInt(id),
          })),
        );
      }

      return await this.findById(savedBrand.id);
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async update(updateBrandDto: UpdateBrandDto) {
    try {
      const brand = await this.findById(updateBrandDto.id);
      if (!brand) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.BRAND);
      }

      const { categoryIds, id, ...brandDataToUpdate } = updateBrandDto;
      Object.assign(brand, brandDataToUpdate);
      await this.brandRepository.save(brand);

      if (categoryIds) {
        const categoryIdsAsString = categoryIds.map(id => id.toString());
        await this.brandCategoryService.syncForBrand(brand.id, categoryIdsAsString);
      }

      return await this.findById(brand.id);
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async findCategoriesByBrandId(id: bigint) {
    try {
      const brand = await this.buildBrandQueryBuilder()
        .where('brand.id = :id', { id })
        .getOne();

      if (!brand) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.BRAND);
      }

      return brand.brandCategories.map(bc => bc.category);
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async delete(id: bigint) {
    try {
      const brand = await this.brandRepository.findOneBy({ id: id });
      if (!brand) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.BRAND);
      }
      return await this.brandRepository.softDelete(id.toString());
    } catch (exception) {
      HandleException.exception(exception);
    }
  }
}
