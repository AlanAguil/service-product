import { forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { NotFoundCustomException, NotFoundCustomExceptionType } from 'src/common/exceptions/types/notFound.exception';
import { Not, Repository } from 'typeorm';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { OrderHistory } from './entity/order-history.entity';
import { Order } from './entity/order.entity';
import { CreateOrderDto } from './model/create-order.dto';
import { UpdateOrderDto } from './model/update-order.dto';
import { ReportService } from '../report/report.service';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderHistory)
    private orderHistoryRepository: Repository<OrderHistory>,
    @Inject(forwardRef(() => WhatsappService))
    private readonly whatsappService: WhatsappService,
    private reportService: ReportService
  ) { }

  async findAll() {
    try {
      this.logger.log('Finding all orders');
      return await this.orderRepository.find({
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      this.logger.error(`Error finding all orders: ${error.message}`);
      throw error;
    }
  }

  async findById(id: bigint) {
    try {
      this.logger.log(`Finding order with id: ${id}`);
      const order = await this.orderRepository.findOne({
        where: { id }
      });

      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      return order;
    } catch (error) {
      this.logger.error(`Error finding order by id ${id}: ${error.message}`);
      throw error;
    }
  }

  async findByUserId(userId: bigint) {
    try {
      this.logger.log(`Finding orders for user with id: ${userId}`);
      return await this.orderRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      this.logger.error(`Error finding orders by user id ${userId}: ${error.message}`);
      throw error;
    }
  }

  async findByStatus(status: string) {
    try {
      this.logger.log(`Finding orders with status: ${status}`);
      return await this.orderRepository.find({
        where: { status },
        order: { updatedAt: 'DESC' }
      });
    } catch (error) {
      this.logger.error(`Error finding orders by status ${status}: ${error.message}`);
      throw error;
    }
  }

  findByPhoneNumber = async (phoneNumber: string) => {
    try {
      return await this.orderRepository.find({
        where: { user: { phoneNumber } }, // Suponiendo que hay una relación con un modelo de usuario
        relations: ['orderDetails', 'bills', 'user'],
        order: {
          createdAt: 'DESC'
        }
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  private async createOrderHistory(): Promise<OrderHistory> {
    try {
      this.logger.log('Creating new order history');
      
      const orderHistory = new OrderHistory();
      orderHistory.transactionId = `TX-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      orderHistory.receiver = 'Sin especificar';
      orderHistory.shippingFullAddress = 'Sin especificar';
      orderHistory.shippingCity = 'Sin especificar';
      orderHistory.shippingState = 'Sin especificar';
      orderHistory.shippingPostalCode = '00000';
      orderHistory.shippingPhoneNumber = '0000000000';
      orderHistory.shippingCost = 0;
      orderHistory.businessName = '';
      orderHistory.rfc = '';
      orderHistory.cfdiUse = '';
      orderHistory.taxRegime = '';
      orderHistory.billingFullAddress = '';
      orderHistory.lastFourDigits = '';
      orderHistory.paymentMethod = 'CASH';
      orderHistory.paymentProvider = '';
      orderHistory.subtotal = 0;
      orderHistory.tax = 0;
      orderHistory.total = 0;

      return await this.orderHistoryRepository.save(orderHistory);
    } catch (error) {
      this.logger.error(`Error creating order history: ${error.message}`);
      throw error;
    }
  }

  async create(createOrderDto: CreateOrderDto) {
    try {
      // Primero creamos el historial de la orden con valores por defecto
      const savedOrderHistory = await this.createOrderHistory();

      this.logger.log('Creating new order');
      
      // Luego creamos la orden con el ID del historial
      const order = this.orderRepository.create({
        ...createOrderDto,
        orderHistoryId: savedOrderHistory.id,
        estimatedDeliveryDate: createOrderDto.estimatedDeliveryDate 
          ? new Date(createOrderDto.estimatedDeliveryDate)
          : undefined
      });

      const savedOrder = await this.orderRepository.save(order);
      
      // Generar y enviar reporte de la nueva orden
      await this.reportService.generateAndSendOrderReport(savedOrder.id.toString());
      
      return {
        success: true,
        data: savedOrder
      };
    } catch (error) {
      this.logger.error(`Error creating order: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async update(updateOrderDto: UpdateOrderDto) {
    try {
      this.logger.log(`Updating order with id: ${updateOrderDto.id}`);

      const order = await this.findById(updateOrderDto.id);

      // Update the order with new values
      Object.assign(order, updateOrderDto);

      return await this.orderRepository.save(order);
    } catch (error) {
      this.logger.error(`Error updating order: ${error.message}`);
      throw error;
    }
  }

  async updateStatus(id: bigint, status: string) {
    try {
      this.logger.log(`Updating order ${id} status to: ${status}`);

      const order = await this.findById(id);
      order.status = status;

      const savedOrder = await this.orderRepository.save(order);

      // Enviar mensaje de WhatsApp al usuario
      try {
        const message = `Tu orden #${order.id} ha sido actualizada a estado: ${status}`;
        await this.whatsappService.sendMessage(order.user.phoneNumber, message);
      } catch (whatsappError) {
        this.logger.error(`Error sending WhatsApp message for order ${id}: ${whatsappError.message}`);
      }

      return savedOrder;
    } catch (error) {
      this.logger.error(`Error updating order status: ${error.message}`);
      throw error;
    }
  }

  async delete(id: bigint) {
    try {
      const order = await this.orderRepository.findOneBy({ id: id });
      if (!order) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.ORDER);
      }
      return await this.orderRepository.softDelete(id.toString());
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  async getActiveOrders() {
    try {
      this.logger.log('Finding active orders');
      return await this.orderRepository.find({
        where: [
          { status: Not('DELIVERED') },
          { status: Not('CANCELLED') }
        ],
        order: { createdAt: 'DESC' },
        relations: ['user', 'orderDetails']
      });
    } catch (error) {
      this.logger.error(`Error finding active orders: ${error.message}`);
      throw error;
    }
  }

  async getMonthlySales(year: number, month: number) {
    try {
      this.logger.log(`Getting monthly sales for ${year}-${month}`);
      
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const sales = await this.orderRepository
        .createQueryBuilder('order')
        .leftJoin('order.orderDetails', 'orderDetails')
        .leftJoin('order.bills', 'bills')
        .select([
          'DATE(order.createdAt) as date',
          'COUNT(DISTINCT order.id) as totalOrders',
          'SUM(orderDetails.quantity * orderDetails.price) as totalSales',
          'SUM(bills.total) as totalBilled'
        ])
        .where('order.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate
        })
        .andWhere('order.status != :cancelled', { cancelled: 'CANCELLED' })
        .groupBy('DATE(order.createdAt)')
        .orderBy('date', 'ASC')
        .getRawMany();

      return {
        year,
        month,
        totalOrders: sales.reduce((acc, curr) => acc + Number(curr.totalOrders), 0),
        totalSales: sales.reduce((acc, curr) => acc + Number(curr.totalSales || 0), 0),
        totalBilled: sales.reduce((acc, curr) => acc + Number(curr.totalBilled || 0), 0),
        dailySales: sales
      };
    } catch (error) {
      this.logger.error(`Error getting monthly sales: ${error.message}`);
      throw error;
    }
  }
  
  async findByType(type: 'PURCHASE' | 'RENTAL') {
    return this.orderRepository.find({
      where: { type },
      relations: ['user', 'orderDetails', 'order'],
    });
  }
}
