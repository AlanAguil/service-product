import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entity/category.entity';
import { CreateCategoryDto } from './model/create.category.dto';
import { UpdateCategoryDto } from './model/update.category.dto';
import { stringConstants } from '../../utils/string.constant';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from '../../common/exceptions/types/notFound.exception';
import { HandleException } from '../../common/exceptions/handler/handle.exception';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async findAll() {
    try {
      const categories = await this.categoryRepository
        .createQueryBuilder('category')
        .leftJoinAndSelect('category.brandCategories', 'brandCategory')
        .leftJoinAndSelect('brandCategory.brand', 'brand')
        .getMany();

      return categories.map(({ brandCategories, ...category }) => ({
        ...category,
        brands: brandCategories.map(bc => bc.brand)
      }));
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async findAllActive() {
    try {
      const categories = await this.categoryRepository
        .createQueryBuilder('category')
        .leftJoinAndSelect('category.brandCategories', 'brandCategory')
        .leftJoinAndSelect('brandCategory.brand', 'brand')
        .where('category.status = :status', { status: stringConstants.STATUS_ACTIVE })
        .getMany();

      return categories.map(({ brandCategories, ...category }) => ({
        ...category,
        brands: brandCategories.map(bc => bc.brand)
      }));
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async findById(id: bigint) {
    try {
      const category = await this.categoryRepository
        .createQueryBuilder('category')
        .leftJoinAndSelect('category.brandCategories', 'brandCategory')
        .leftJoinAndSelect('brandCategory.brand', 'brand')
        .where('category.id = :id', { id })
        .getOne();

      if (!category) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CATEGORY);
      }

      const { brandCategories, ...categoryData } = category;
      return {
        ...categoryData,
        brands: brandCategories.map(bc => bc.brand)
      };
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async create(createCategoryDto: CreateCategoryDto){
    try {
      const category = this.categoryRepository.create(createCategoryDto);
      return await this.categoryRepository.save(category);
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async update(updateCategoryDto: UpdateCategoryDto){
    try {
      const category = await this.findById(updateCategoryDto.id);
      if (!category) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CATEGORY);
      }
      Object.assign(category, updateCategoryDto);
      await this.categoryRepository.update({ id: category.id }, updateCategoryDto);
      return await this.findById(category.id);
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async delete(id: bigint) {
    try {
      const category = await this.categoryRepository.findOneBy({ id: id });
      if (!category) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CATEGORY);
      }
      return await this.categoryRepository.softDelete(id.toString());
    } catch (exception) {
      HandleException.exception(exception);
    }
  }
}
