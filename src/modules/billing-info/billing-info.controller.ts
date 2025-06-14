import { Controller, Get, Post, Put, Body, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { BillingInfoService } from './billing-info.service';
import { CreateBillingInfoDto } from './model/create-billing-info.dto';
import { UpdateBillingInfoDto } from './model/update-billing-info.dto';

@ApiTags('Billing Info')
@Controller('billing-infos')
export class BillingInfoController {
  constructor(private readonly billingInfoService: BillingInfoService) { }

  @Get()
  @ApiOperation({ summary: 'Get all billing information' })
  @ApiResponse({ status: 200, description: 'Return all billing information' })
  async findAll() {
    return await this.billingInfoService.findAll();
  }

  @Put('/:infoId/userId/:userId/set-default')
  @ApiOperation({ summary: 'Set billing info as default for user' })
  @ApiResponse({ status: 200, description: 'Billing info set as default successfully' })
  @ApiResponse({ status: 404, description: 'Billing info not found' })
  async setAsDefault(
    @Param('infoId') infoId: string,
    @Param('userId') userId: string
  ) {
    return await this.billingInfoService.setAsDefault(BigInt(infoId), BigInt(userId));
  }

  @Get('/user/:userId')
  @ApiOperation({ summary: 'Get billing information by user id' })
  @ApiResponse({ status: 200, description: 'Return billing information by user id' })
  async findByUserId(@Param('userId') userId: string) {
    return await this.billingInfoService.findByUserId(BigInt(userId));
  }

  @Get('/:infoId')
  @ApiOperation({ summary: 'Get billing information by id' })
  @ApiResponse({ status: 200, description: 'Return billing information by id' })
  @ApiResponse({ status: 404, description: 'Billing information not found' })
  async findById(@Param('infoId') infoId: string) {
    return await this.billingInfoService.findById(BigInt(infoId));
  }

  @Post()
  @ApiOperation({ summary: 'Create new billing information' })
  @ApiResponse({ status: 201, description: 'Billing information created successfully' })
  async create(@Body() createBillingInfoDto: CreateBillingInfoDto) {
    return await this.billingInfoService.create(createBillingInfoDto);
  }

  @Put()
  @ApiOperation({ summary: 'Update billing information' })
  @ApiResponse({ status: 200, description: 'Billing information updated successfully' })
  @ApiResponse({ status: 404, description: 'Billing information not found' })
  async update(@Body() updateBillingInfoDto: UpdateBillingInfoDto) {
    return await this.billingInfoService.update(updateBillingInfoDto);
  }

  @Delete('/delete/:id')
  @ApiOperation({ summary: 'Delete a bill by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Bill ID' })
  @ApiResponse({ status: 200, description: 'Bill deleted successfully' })
  @ApiResponse({ status: 404, description: 'Bill not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async delete(@Param('id') id: bigint) {
    return await this.billingInfoService.delete(id);
  }

}
