import { Inject, Injectable, Logger, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { NotFoundCustomException, NotFoundCustomExceptionType } from 'src/common/exceptions/types/notFound.exception';
import { Repository } from 'typeorm';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { Bill } from './entity/bill.entity';
import { CreateBillDto } from './model/create-bill.dto';
import { UpdateBillDto } from './model/update-bill.dto';

@Injectable()
export class BillService {
  private readonly logger = new Logger(BillService.name);

  constructor(
    @InjectRepository(Bill)
    private billRepository: Repository<Bill>,
    @Inject(forwardRef(() => WhatsappService))
    private readonly whatsappService: WhatsappService,
  ) { }

  async findAll() {
    try {
      this.logger.log('Finding all bills');
      return await this.billRepository.find({
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      this.logger.error(`Error finding all bills: ${error.message}`);
      throw error;
    }
  }

  async findById(id: bigint) {
    try {
      this.logger.log(`Finding bill with id: ${id}`);
      const bill = await this.billRepository.findOne({
        where: { id }
      });

      if (!bill) {
        throw new NotFoundException(`Bill with ID ${id} not found`);
      }

      return bill;
    } catch (error) {
      this.logger.error(`Error finding bill by id ${id}: ${error.message}`);
      throw error;
    }
  }

  async findByOrderId(orderId: bigint) {
    try {
      this.logger.log(`Finding bill for order with id: ${orderId}`);
      const bill = await this.billRepository.findOne({
        where: { orderId }
      });

      if (!bill) {
        throw new NotFoundException(`Bill for order ID ${orderId} not found`);
      }

      return bill;
    } catch (error) {
      this.logger.error(`Error finding bill by order id ${orderId}: ${error.message}`);
      throw error;
    }
  }

  /*   async findByUserId(userId: bigint) {
      try {
        this.logger.log(`Finding bills for user with id: ${userId}`);
        return await this.billRepository.find({
          where: { userId },
          order: { createdAt: 'DESC' }
        });
      } catch (error) {
        this.logger.error(`Error finding bills by user id ${userId}: ${error.message}`);
        throw error;
      }
    } */

  async create(createBillDto: CreateBillDto) {
    try {
      this.logger.log('Creating new bill');
      const bill = this.billRepository.create(createBillDto);
      return await this.billRepository.save(bill);
    } catch (error) {
      this.logger.error(`Error creating bill: ${error.message}`);
      throw error;
    }
  }

  async update(updateBillDto: UpdateBillDto) {
    try {
      this.logger.log(`Updating bill with id: ${updateBillDto.id}`);

      const bill = await this.findById(updateBillDto.id);

      // Update the bill with new values
      Object.assign(bill, updateBillDto);

      return await this.billRepository.save(bill);
    } catch (error) {
      this.logger.error(`Error updating bill: ${error.message}`);
      throw error;
    }
  }

  async updatePaymentStatus(id: bigint, paymentStatus: string) {
    try {
      this.logger.log(`Updating bill ${id} payment status to: ${paymentStatus}`);

      const bill = await this.findById(id);
      bill.paymentStatus = paymentStatus;

      const savedBill = await this.billRepository.save(bill);

      // Enviar mensaje de WhatsApp al usuario
      try {
        const message = `Tu pago por la orden #${bill.id} ha sido actualizada a estado: ${paymentStatus}`;
        await this.whatsappService.sendMessage(bill.order.user.phoneNumber, message);
      } catch (whatsappError) {
        this.logger.error(`Error sending WhatsApp message for order ${id}: ${whatsappError.message}`);
      }

      return savedBill;
    } catch (error) {
      this.logger.error(`Error updating bill payment status: ${error.message}`);
      throw error;
    }
  }

  async delete(id: bigint) {
    try {
      const bill = await this.billRepository.findOneBy({ id: id });
      if (!bill) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.BILL);
      }
      return await this.billRepository.softDelete(id.toString());
    } catch (exception) {
      HandleException.exception(exception);
    }
  }
}
