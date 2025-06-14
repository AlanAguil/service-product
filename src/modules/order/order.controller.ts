import { Controller, Get, Post, Put, Body, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto } from './model/create-order.dto';
import { UpdateOrderDto } from './model/update-order.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiResponse({ status: 200, description: 'Return all orders' })
  async findAll() {
    return await this.orderService.findAll();
  }

  @Get('/user/:userId')
  @ApiOperation({ summary: 'Get orders by user id' })
  @ApiResponse({ status: 200, description: 'Return orders by user id' })
  async findByUserId(@Param('userId') userId: string) {
    return await this.orderService.findByUserId(BigInt(userId));
  }

  @Get('/:orderId')
  @ApiOperation({ summary: 'Get order by id' })
  @ApiResponse({ status: 200, description: 'Return order by id' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findById(@Param('orderId') orderId: string) {
    return await this.orderService.findById(BigInt(orderId));
  }

  @Get('/status/:status')
  @ApiOperation({ summary: 'Get orders by status' })
  @ApiResponse({ status: 200, description: 'Return orders by status' })
  async findByStatus(@Param('status') status: string) {
    return await this.orderService.findByStatus(status);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  async create(@Body() createOrderDto: CreateOrderDto) {
    return await this.orderService.create(createOrderDto);
  }

  @Put()
  @ApiOperation({ summary: 'Update an order' })
  @ApiResponse({ status: 200, description: 'Order updated successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async update(@Body() updateOrderDto: UpdateOrderDto) {
    return await this.orderService.update(updateOrderDto);
  }

  @Put('/:orderId/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateStatus(
    @Param('orderId') orderId: string,
    @Body('status') status: string
  ) {
    return await this.orderService.updateStatus(BigInt(orderId), status);
  }

  @Delete('/delete/:id')
  @ApiOperation({ summary: 'Delete an order by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order deleted successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async delete(@Param('id') id: bigint) {
    return await this.orderService.delete(id);
  }

  @Get('/stats/active')
  @ApiOperation({ summary: 'Get active orders statistics' })
  @ApiResponse({ status: 200, description: 'Active orders statistics retrieved successfully' })
  async getActiveOrders() {
    return await this.orderService.getActiveOrders();
  }

  @Get('/stats/monthly-sales')
  @ApiOperation({ summary: 'Get monthly sales statistics' })
  @ApiResponse({ status: 200, description: 'Monthly sales statistics retrieved successfully' })
  @ApiQuery({ name: 'year', type: 'number', required: true })
  @ApiQuery({ name: 'month', type: 'number', required: true })
  async getMonthlySales(
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    return await this.orderService.getMonthlySales(year, month);
  }

  @Get('/type/purchases')
  @ApiOperation({ summary: 'Obtener órdenes de compra' })
  @ApiResponse({ status: 200, description: 'Órdenes de compra obtenidas exitosamente' })
  async getPurchaseOrders() {
    return await this.orderService.findByType('PURCHASE');
  }

  @Get('/type/rentals')
  @ApiOperation({ summary: 'Obtener órdenes de renta' })
  @ApiResponse({ status: 200, description: 'Órdenes de renta obtenidas exitosamente' })
  async getRentalOrders() {
    return await this.orderService.findByType('RENTAL');
  }
}
