import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entity/product.entity';
import { CreateProductDto } from './model/create.product.dto';
import { UpdateProductDto } from './model/update.product.dto';
import { MediaService } from '../media/media.service';
import { stringConstants } from '../../utils/string.constant';
import { HandleException } from '../../common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from '../../common/exceptions/types/notFound.exception';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private mediaService: MediaService,
  ) {}

  async findAll() {
    try {
      const products = await this.productRepository.find();
      const productsWithMedia = await Promise.all(
        products.map(async (product) => {
          const media = await this.mediaService.findByEntityId(
            product.id,
            stringConstants.ENTITY_TYPE_PRODUCT
          );
          return {
            ...product,
            media
          };
        })
      );
      return productsWithMedia;
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async findAllActive() {
    try {
      const products = await this.productRepository.find({
        where: { status: stringConstants.STATUS_ACTIVE },
      });
      const productsWithMedia = await Promise.all(
        products.map(async (product) => {
          const media = await this.mediaService.findByEntityId(
            product.id,
            stringConstants.ENTITY_TYPE_PRODUCT
          );
          return {
            ...product,
            media
          };
        })
      );
      return productsWithMedia;
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async findById(id: bigint) {
    try {
      const product = await this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.brand', 'brand')
        .where('product.id = :id', { id })
        .getOne();

      if (!product) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.PRODUCT);
      }

      // Obtener los medios relacionados al producto
      const media = await this.mediaService.findByEntityId(
        id, 
        stringConstants.ENTITY_TYPE_PRODUCT
      );

      // Retornar el producto con sus medios
      return {
        ...product,
        media
      };
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async findByBrandId(brandId: bigint) {
    try {
      const products = await this.productRepository.find({
        where: { brandId: brandId },
      });
      const productsWithMedia = await Promise.all(
        products.map(async (product) => {
          const media = await this.mediaService.findByEntityId(
            product.id,
            stringConstants.ENTITY_TYPE_PRODUCT
          );
          return {
            ...product,
            media
          };
        })
      );
      return productsWithMedia;
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async findByCategoryId(categoryId: bigint) {
    try {
      const products = await this.productRepository.find({
        where: { categoryId: categoryId },
      });
      const productsWithMedia = await Promise.all(
        products.map(async (product) => {
          const media = await this.mediaService.findByEntityId(
            product.id,
            stringConstants.ENTITY_TYPE_PRODUCT
          );
          return {
            ...product,
            media
          };
        })
      );
      return productsWithMedia;
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async create(createProductDto: CreateProductDto) {
    try {
      const { media, ...productData } = createProductDto;
      
      const product = this.productRepository.create(productData);
      const savedProduct = await this.productRepository.save(product);
      
      if (media && media.length > 0) {
        await this.mediaService.update(media, savedProduct.id, stringConstants.ENTITY_TYPE_PRODUCT);
      }
      
      return this.findById(savedProduct.id);
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async update(updateProductDto: UpdateProductDto) {
    try {
      const { media, ...productData } = updateProductDto;
      
      const product = await this.productRepository.findOne({
        where: { id: updateProductDto.id }
      });
      
      if (!product) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.PRODUCT);
      }
      
      Object.assign(product, productData);
      await this.productRepository.update({ id: product.id }, product);
      
      if (media) {
        await this.mediaService.update(media, product.id, stringConstants.ENTITY_TYPE_PRODUCT);
      }
      
      return this.findById(product.id);
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async findPreviewAll() {
    try {
      const products = await this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.brand', 'brand')
        .select([
          'product.id', 
          'product.name', 
          'product.description', 
          'product.price', 
          'product.status',
          'product.color',
          'brand.id',
          'brand.name',
          'brand.description',
          'brand.color',
          'brand.url',
          'brand.status',
        ])
        .getMany();
      
      const productsWithMedia = await Promise.all(
        products.map(async (product) => {
          const media = await this.mediaService.findByEntityId(
            product.id,
            stringConstants.ENTITY_TYPE_PRODUCT
          );
          return {
            ...product,
            media
          };
        })
      );
      return productsWithMedia;
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async findBrandIdAndActive(brandId: number) {
    try {
      const products = await this.productRepository.find({
        where: { 
          brandId: BigInt(brandId),
          status: stringConstants.STATUS_ACTIVE 
        }
      });
      const productsWithMedia = await Promise.all(
        products.map(async (product) => {
          const media = await this.mediaService.findByEntityId(
            product.id,
            stringConstants.ENTITY_TYPE_PRODUCT
          );
          return {
            ...product,
            media
          };
        })
      );
      return productsWithMedia;
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async findCategoryIdAndBrandIdAndActive(categoryId: number, brandId: number) {
    try {
      const products = await this.productRepository.find({
        where: { 
          categoryId: BigInt(categoryId),
          brandId: BigInt(brandId),
          status: stringConstants.STATUS_ACTIVE 
        }
      });
      const productsWithMedia = await Promise.all(
        products.map(async (product) => {
          const media = await this.mediaService.findByEntityId(
            product.id,
            stringConstants.ENTITY_TYPE_PRODUCT
          );
          return {
            ...product,
            media
          };
        })
      );
      return productsWithMedia;
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async findByIdAndActive(productId: number) {
    try {
      const product = await this.productRepository.findOne({
        where: { 
          id: BigInt(productId),
          status: stringConstants.STATUS_ACTIVE 
        }
      });

      if (!product) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.PRODUCT);
      }

      const media = await this.mediaService.findByEntityId(
        BigInt(productId),
        stringConstants.ENTITY_TYPE_PRODUCT
      );

      return {
        ...product,
        media
      };
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async delete(id: bigint) {
    try {
      const product = await this.productRepository.findOneBy({ id: id });
      if (!product) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.PRODUCT);
      }
      return await this.productRepository.softDelete(id.toString());
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  async getInventoryStats() {
    try {
      const products = await this.productRepository
        .createQueryBuilder('product')
        .leftJoin('product.orderDetails', 'orderDetails')
        .leftJoin('product.productSpareParts', 'productSpareParts')
        .select([
          'product.id',
          'product.name',
          'product.description',
          'product.price',
          'product.status',
          'product.stock',
          'COUNT(DISTINCT orderDetails.id) as totalOrders',
          'SUM(orderDetails.quantity) as totalSold',
          'COUNT(DISTINCT productSpareParts.id) as totalSpareParts'
        ])
        .where('product.status = :status', { status: stringConstants.STATUS_ACTIVE })
        .groupBy('product.id')
        .orderBy('product.stock', 'ASC')
        .getRawMany();

      return {
        totalProducts: products.length,
        lowStock: products.filter(p => p.stock < 10).length,
        outOfStock: products.filter(p => p.stock === 0).length,
        totalSold: products.reduce((acc, curr) => acc + Number(curr.totalSold || 0), 0),
        totalOrders: products.reduce((acc, curr) => acc + Number(curr.totalOrders || 0), 0),
        products
      };
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async getTopSellingProducts(limit: number = 10) {
    try {
      const products = await this.productRepository
        .createQueryBuilder('product')
        .leftJoin('product.orderDetails', 'orderDetails')
        .leftJoin('product.productSpareParts', 'productSpareParts')
        .select([
          'product.id',
          'product.name',
          'product.description',
          'product.price',
          'product.stock',
          'COUNT(DISTINCT orderDetails.id) as totalOrders',
          'SUM(orderDetails.quantity) as totalSold',
          'SUM(orderDetails.quantity * orderDetails.unitPrice) as totalRevenue',
          'COUNT(DISTINCT productSpareParts.id) as totalSpareParts'
        ])
        .groupBy('product.id')
        .orderBy('totalSold', 'DESC')
        .limit(limit)
        .getRawMany();

      return products.map(product => ({
        ...product,
        totalSold: Number(product.totalSold || 0),
        totalRevenue: Number(product.totalRevenue || 0),
        totalOrders: Number(product.totalOrders || 0),
        totalSpareParts: Number(product.totalSpareParts || 0)
      }));
    } catch (error) {
      HandleException.exception(error);
    }
  }
}
