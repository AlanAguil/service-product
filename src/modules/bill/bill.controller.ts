import { Controller, Get, Post, Put, Body, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { BillService } from './bill.service';
import { CreateBillDto } from './model/create-bill.dto';
import { UpdateBillDto } from './model/update-bill.dto';

@ApiTags('Bills')
@Controller('bills')
export class BillController {
  constructor(private readonly billService: BillService) { }

  @Get()
  @ApiOperation({ summary: 'Get all bills' })
  @ApiResponse({ status: 200, description: 'Return all bills' })
  async findAll() {
    return await this.billService.findAll();
  }

  @Get('/:billId')
  @ApiOperation({ summary: 'Get bill by id' })
  @ApiResponse({ status: 200, description: 'Return bill by id' })
  @ApiResponse({ status: 404, description: 'Bill not found' })
  async findById(@Param('billId') billId: string) {
    return await this.billService.findById(BigInt(billId));
  }

  @Post()
  @ApiOperation({ summary: 'Create a new bill' })
  @ApiResponse({ status: 201, description: 'Bill created successfully' })
  async create(@Body() createBillDto: CreateBillDto) {
    return await this.billService.create(createBillDto);
  }

  @Put()
  @ApiOperation({ summary: 'Update a bill' })
  @ApiResponse({ status: 200, description: 'Bill updated successfully' })
  @ApiResponse({ status: 404, description: 'Bill not found' })
  async update(@Body() updateBillDto: UpdateBillDto) {
    return await this.billService.update(updateBillDto);
  }

  @Get('/order/:orderId')
  @ApiOperation({ summary: 'Get bill by order id' })
  @ApiResponse({ status: 200, description: 'Return bill by order id' })
  @ApiResponse({ status: 404, description: 'Bill not found' })
  async findByOrderId(@Param('orderId') orderId: string) {
    return await this.billService.findByOrderId(BigInt(orderId));
  }

  @Put('/:billId/payment-status')
  @ApiOperation({ summary: 'Update bill payment status' })
  @ApiResponse({ status: 200, description: 'Payment status updated successfully' })
  @ApiResponse({ status: 404, description: 'Bill not found' })
  async updatePaymentStatus(
    @Param('billId') billId: string,
    @Body('paymentStatus') paymentStatus: string
  ) {
    return await this.billService.updatePaymentStatus(BigInt(billId), paymentStatus);
  }

  @Delete('/delete/:id')
  @ApiOperation({ summary: 'Delete a bill by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Bill ID' })
  @ApiResponse({ status: 200, description: 'Bill deleted successfully' })
  @ApiResponse({ status: 404, description: 'Bill not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async delete(@Param('id') id: bigint) {
    return await this.billService.delete(id);
  }
  
  /*   @Get('/user/:userId')
  @ApiOperation({ summary: 'Get bills by user id' })
  @ApiResponse({ status: 200, description: 'Return bills by user id' })
  async findByUserId(@Param('userId') userId: bigint) {
    return await this.billService.findByUserId(userId);
  } 

  @Get('/active/user/:userId/')
  async findActiveByUserId(@Param('userId') userId: bigint) {
    return await this.billService.findActiveByUserId(userId);
  }

  @Get('/history/:orderId')
  async findFromOrderHistory(@Param('orderId') orderId: bigint) {
    return await this.billService.findFromOrderHistory(orderId);
  } */

}
