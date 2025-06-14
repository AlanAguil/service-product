import { Controller, Get, Post, Put, Body, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ShippingAddressService } from './shipping-address.service';
import { CreateShippingAddressDto } from './model/create-shipping-address.dto';
import { UpdateShippingAddressDto } from './model/update-shipping-address.dto';

@ApiTags('Shipping Addresses')
@Controller('shipping-addresses')
export class ShippingAddressController {
  constructor(private readonly shippingAddressService: ShippingAddressService) {}

  @Get()
  @ApiOperation({ summary: 'Get all shipping addresses' })
  @ApiResponse({ status: 200, description: 'Return all shipping addresses' })
  async findAll() {
    return await this.shippingAddressService.findAll();
  }

/*   @Get('/user/:userId')
  @ApiOperation({ summary: 'Get shipping addresses by user id' })
  @ApiResponse({ status: 200, description: 'Return shipping addresses by user id' })
  async findByUserId(@Param('userId') userId: bigint) {
    return await this.shippingAddressService.findByUserId(userId);
  } */

  @Get('/:addressId')
  @ApiOperation({ summary: 'Get shipping address by id' })
  @ApiResponse({ status: 200, description: 'Return shipping address by id' })
  @ApiResponse({ status: 404, description: 'Shipping address not found' })
  async findById(@Param('addressId') addressId: bigint) {
    return await this.shippingAddressService.findById(addressId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new shipping address' })
  @ApiResponse({ status: 201, description: 'Shipping address created successfully' })
  async create(@Body() createShippingAddressDto: CreateShippingAddressDto) {
    return await this.shippingAddressService.create(createShippingAddressDto);
  }

  @Put()
  @ApiOperation({ summary: 'Update a shipping address' })
  @ApiResponse({ status: 200, description: 'Shipping address updated successfully' })
  @ApiResponse({ status: 404, description: 'Shipping address not found' })
  async update(@Body() updateShippingAddressDto: UpdateShippingAddressDto) {
    return await this.shippingAddressService.update(updateShippingAddressDto);
  }

  @Delete('/delete/:id')
  @ApiOperation({ summary: 'Delete a shipping address by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Shipping Address ID' })
  @ApiResponse({ status: 200, description: 'Shipping address deleted successfully' })
  @ApiResponse({ status: 404, description: 'Shipping address not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async delete(@Param('id') id: bigint) {
    return await this.shippingAddressService.delete(id);
  }
}
