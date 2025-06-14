import { Controller, Get, Post, Put, Body, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { OrderDetailService } from './order-details.service';
import { CreateOrderDetailDto } from './model/create-order-details.dto';
import { UpdateOrderDetailDto } from './model/update-order-details.dto';

@ApiTags('Order Details')
@Controller('order-details')
export class OrderDetailsController {
  constructor(private readonly orderDetailService: OrderDetailService) {}

  @Get()
  @ApiOperation({ summary: 'Get all order details' })
  @ApiResponse({ status: 200, description: 'Return all order details' })
  async findAll() {
    return await this.orderDetailService.findAll();
  }

  @Get('/order/:orderId')
  @ApiOperation({ summary: 'Get order details by order id' })
  @ApiResponse({ status: 200, description: 'Return order details by order id' })
  async findByOrderId(@Param('orderId') orderId: string) {
    return await this.orderDetailService.findByOrderId(BigInt(orderId));
  }

  @Get('/:detailId')
  @ApiOperation({ summary: 'Get order detail by id' })
  @ApiResponse({ status: 200, description: 'Return order detail by id' })
  @ApiResponse({ status: 404, description: 'Order detail not found' })
  async findById(@Param('detailId') detailId: string) {
    return await this.orderDetailService.findById(BigInt(detailId));
  }

  @Post()
  @ApiOperation({ summary: 'Create a new order detail' })
  @ApiResponse({ status: 201, description: 'Order detail created successfully' })
  async create(@Body() createOrderDetailDto: CreateOrderDetailDto) {
    return await this.orderDetailService.create(createOrderDetailDto);
  }

  @Put()
  @ApiOperation({ summary: 'Update an order detail' })
  @ApiResponse({ status: 200, description: 'Order detail updated successfully' })
  @ApiResponse({ status: 404, description: 'Order detail not found' })
  async update(@Body() updateOrderDetailDto: UpdateOrderDetailDto) {
    return await this.orderDetailService.update(updateOrderDetailDto);
  }

  @Delete('/delete/:id')
  @ApiOperation({ summary: 'Delete an order detail by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Order Detail ID' })
  @ApiResponse({ status: 200, description: 'Order detail deleted successfully' })
  @ApiResponse({ status: 404, description: 'Order detail not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async delete(@Param('id') id: bigint) {
    return await this.orderDetailService.delete(id);
  }
}
