import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductSparePart } from './entity/product-spare-part.entity';
import { CreateProductSparePartDto } from './model/create-product-spare-part.dto';
import { UpdateProductSparePartDto } from './model/update-product-spare-part.dto';
import { stringConstants } from '../../utils/string.constant';
import { NotFoundCustomException, NotFoundCustomExceptionType } from 'src/common/exceptions/types/notFound.exception';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';

@Injectable()
export class ProductSparePartService {
  private readonly logger = new Logger(ProductSparePartService.name);

  constructor(
    @InjectRepository(ProductSparePart)
    private productSparePartRepository: Repository<ProductSparePart>,
  ) { }

  async findAll() {
    try {
      this.logger.log('Finding all product spare part relationships');
      return await this.productSparePartRepository.find();
    } catch (error) {
      this.logger.error(`Error finding all product spare part relationships: ${error.message}`);
      throw error;
    }
  }

  async findById(id: bigint) {
    try {
      this.logger.log(`Finding product spare part relationship with id: ${id}`);
      const productSparePart = await this.productSparePartRepository.findOne({
        where: { id }
      });

      if (!productSparePart) {
        throw new NotFoundException(`Product spare part relationship with ID ${id} not found`);
      }

      return productSparePart;
    } catch (error) {
      this.logger.error(`Error finding product spare part relationship by id ${id}: ${error.message}`);
      throw error;
    }
  }

  async findByProductId(productId: bigint) {
    try {
      this.logger.log(`Finding product spare part relationships for product with id: ${productId}`);
      return await this.productSparePartRepository.find({
        where: { productId }
      });
    } catch (error) {
      this.logger.error(`Error finding product spare part relationships by product id ${productId}: ${error.message}`);
      throw error;
    }
  }

  async findBySparePartId(sparePartId: bigint) {
    try {
      this.logger.log(`Finding product spare part relationships for spare part with id: ${sparePartId}`);
      return await this.productSparePartRepository.find({
        where: { sparePartId }
      });
    } catch (error) {
      this.logger.error(`Error finding product spare part relationships by spare part id ${sparePartId}: ${error.message}`);
      throw error;
    }
  }

  async create(createProductSparePartDto: CreateProductSparePartDto) {
    try {
      this.logger.log('Creating new product spare part relationship');
      const productSparePart = this.productSparePartRepository.create(createProductSparePartDto);
      return await this.productSparePartRepository.save(productSparePart);
    } catch (error) {
      this.logger.error(`Error creating product spare part relationship: ${error.message}`);
      throw error;
    }
  }

  async update(updateProductSparePartDto: UpdateProductSparePartDto) {
    try {
      this.logger.log(`Updating product spare part relationship with id: ${updateProductSparePartDto.id}`);

      const productSparePart = await this.findById(updateProductSparePartDto.id);
      
      const { id, ...updateData } = updateProductSparePartDto;
      // Update the product spare part relationship with new values
      Object.assign(productSparePart, updateData);

      return await this.productSparePartRepository.save(productSparePart);
    } catch (error) {
      this.logger.error(`Error updating product spare part relationship: ${error.message}`);
      throw error;
    }
  }

  async delete(id: bigint) {
    try {
      const productSparePart = await this.productSparePartRepository.findOneBy({ id: id });
      if (!productSparePart) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.PRODUCT_SPARE_PART);
      }
      return await this.productSparePartRepository.softDelete(id.toString());
    } catch (exception) {
      HandleException.exception(exception);
    }
  }
}
