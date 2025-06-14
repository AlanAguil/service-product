import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { BrandCategory } from './entity/brand-category.entity';
import { CreateBrandCategoryDto } from './model/create-brand-category.dto';
import { UpdateBrandCategoryDto } from './model/update-brand-category.dto';
import { stringConstants } from '../../utils/string.constant';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { NotFoundCustomException } from 'src/common/exceptions/types/notFound.exception';
import { NotFoundCustomExceptionType } from 'src/common/exceptions/types/notFound.exception';

@Injectable()
export class BrandCategoryService {

  constructor(
    @InjectRepository(BrandCategory)
    private brandCategoryRepository: Repository<BrandCategory>,
  ) {}

  async findAll() {
    try {
      return await this.brandCategoryRepository.find();
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async findById(id: bigint) {
    try {
      const brandCategory = await this.brandCategoryRepository.findOne({
        where: { id }
      });
      
      if (!brandCategory) {
        throw new NotFoundException(`Brand-category relationship with ID ${id} not found`);
      }
      
      return brandCategory;
    } catch (error) {
        HandleException.exception(error);
    }
  }

  async findByBrandId(brandId: bigint) {
    try {
      return await this.brandCategoryRepository.find({
        where: { brandId }
      });
    } catch (error) {
      HandleException.exception(error);
      return [];
    }
  }

  async findByCategoryId(categoryId: bigint) {
    try {
      return await this.brandCategoryRepository.find({
        where: { categoryId }
      });
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async update(updateBrandCategoryDto: UpdateBrandCategoryDto) {
    try {
      const brandCategory = await this.findById(updateBrandCategoryDto.id);
      if (!brandCategory) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.BRAND_CATEGORY);
      }
      Object.assign(brandCategory, updateBrandCategoryDto);
      
      return await this.brandCategoryRepository.save(brandCategory);
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async bulkCreate(brandCategoriesDto: CreateBrandCategoryDto[]) {
    try {
      const brandCategories = brandCategoriesDto.map(dto => ({
        ...dto,
        brandId: BigInt(dto.brandId),
        categoryId: BigInt(dto.categoryId),
      }));
      const createdRelationships = this.brandCategoryRepository.create(brandCategories);
      return await this.brandCategoryRepository.save(createdRelationships);
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async syncForBrand(brandId: bigint, newCategoryIds: string[]){
    try {
      const newCategoryBigIntIds = newCategoryIds.map(id => BigInt(id));
      const existingRelations = await this.findByBrandId(brandId);
      const existingCategoryIds = existingRelations.map(rel => rel.categoryId);

      const relationsToDelete = existingRelations.filter(
        rel => !newCategoryBigIntIds.some(newId => newId === rel.categoryId)
      );
      
      if (relationsToDelete.length > 0) {
        const idsToDelete = relationsToDelete.map(rel => rel.id);
        await this.brandCategoryRepository.delete({ id: In(idsToDelete) });
      }

      const categoryIdsToAdd = newCategoryBigIntIds.filter(
        newId => !existingCategoryIds.some(existingId => existingId === newId)
      );

      if (categoryIdsToAdd.length > 0) {
        const newRelationsDto: CreateBrandCategoryDto[] = categoryIdsToAdd.map(catId => ({
          brandId: brandId,
          categoryId: catId
        }));
        await this.bulkCreate(newRelationsDto);
      }
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async delete(id: bigint) {
    try {
      const brandCategory = await this.brandCategoryRepository.findOneBy({ id: id });
      if (!brandCategory) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.BRAND_CATEGORY);
      }
      return await this.brandCategoryRepository.softDelete(id.toString());
    } catch (exception) {
      HandleException.exception(exception);
    }
  }
}
