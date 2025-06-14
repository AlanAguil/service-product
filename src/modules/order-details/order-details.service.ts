import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderDetail } from './entity/order-details.entity';
import { CreateOrderDetailDto } from './model/create-order-details.dto';
import { UpdateOrderDetailDto } from './model/update-order-details.dto';
import { stringConstants } from '../../utils/string.constant';

@Injectable()
export class OrderDetailService {
  private readonly logger = new Logger(OrderDetailService.name);

  constructor(
    @InjectRepository(OrderDetail)
    private orderDetailRepository: Repository<OrderDetail>,
  ) {}

  async findAll(): Promise<OrderDetail[]> {
    try {
      this.logger.log('Finding all order details');
      return await this.orderDetailRepository.find();
    } catch (error) {
      this.logger.error(`Error finding all order details: ${error.message}`);
      throw error;
    }
  }

  async findById(id: bigint): Promise<OrderDetail> {
    try {
      this.logger.log(`Finding order detail with id: ${id}`);
      const orderDetail = await this.orderDetailRepository.findOne({
        where: { id }
      });
      
      if (!orderDetail) {
        throw new NotFoundException(`Order detail with ID ${id} not found`);
      }
      
      return orderDetail;
    } catch (error) {
      this.logger.error(`Error finding order detail by id ${id}: ${error.message}`);
      throw error;
    }
  }

  async findByOrderId(orderId: bigint): Promise<OrderDetail[]> {
    try {
      this.logger.log(`Finding order details for order with id: ${orderId}`);
      return await this.orderDetailRepository.find({
        where: { orderId }
      });
    } catch (error) {
      this.logger.error(`Error finding order details by order id ${orderId}: ${error.message}`);
      throw error;
    }
  }

  async findByProductId(productId: bigint): Promise<OrderDetail[]> {
    try {
      this.logger.log(`Finding order details for product with id: ${productId}`);
      return await this.orderDetailRepository.find({
        where: { productId }
      });
    } catch (error) {
      this.logger.error(`Error finding order details by product id ${productId}: ${error.message}`);
      throw error;
    }
  }

  async create(createOrderDetailDto: CreateOrderDetailDto): Promise<OrderDetail> {
    try {
      this.logger.log('Creating new order detail');
      const orderDetail = this.orderDetailRepository.create(createOrderDetailDto);
      return await this.orderDetailRepository.save(orderDetail);
    } catch (error) {
      this.logger.error(`Error creating order detail: ${error.message}`);
      throw error;
    }
  }

  async update(updateOrderDetailDto: UpdateOrderDetailDto): Promise<OrderDetail> {
    try {
      this.logger.log(`Updating order detail with id: ${updateOrderDetailDto.id}`);
      
      const orderDetail = await this.findById(updateOrderDetailDto.id);
      
      // Update the order detail with new values
      Object.assign(orderDetail, updateOrderDetailDto);
      
      return await this.orderDetailRepository.save(orderDetail);
    } catch (error) {
      this.logger.error(`Error updating order detail: ${error.message}`);
      throw error;
    }
  }

  async bulkCreate(orderDetails: CreateOrderDetailDto[]): Promise<OrderDetail[]> {
    try {
      this.logger.log(`Creating ${orderDetails.length} order details in bulk`);
      const createdDetails = this.orderDetailRepository.create(orderDetails);
      return await this.orderDetailRepository.save(createdDetails);
    } catch (error) {
      this.logger.error(`Error creating order details in bulk: ${error.message}`);
      throw error;
    }
  }

  async delete(id: bigint) {
    try {
      const orderDetail = await this.orderDetailRepository.findOneBy({ id: id });
      if (!orderDetail) {
        throw new NotFoundException(`Order detail with ID ${id} not found`);
      }
      return await this.orderDetailRepository.softDelete(id.toString());
    } catch (error) {
      this.logger.error(`Error deleting order detail by id ${id}: ${error.message}`);
      throw error;
    }
  }
}
