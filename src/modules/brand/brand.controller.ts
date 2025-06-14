import { Controller, Get, Post, Put, Body, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './model/create.brand.dto';
import { UpdateBrandDto } from './model/update.brand.dto';
@ApiTags('Brands')
@Controller('brands')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Get()
  @ApiOperation({ summary: 'Get all brands' })
  @ApiResponse({ status: 200, description: 'Return all brands' })
  async findAll() {
    return await this.brandService.findAll();
  }

  @Get('/active')
  @ApiOperation({ summary: 'Get all active brands' })
  @ApiResponse({ status: 200, description: 'Return all active brands' })
  async findAllActive() {
    return await this.brandService.findAllActive();
  }

  @Get('/:brandId')
  @ApiOperation({ summary: 'Get brand by id' })
  @ApiResponse({ status: 200, description: 'Return brand by id' })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  async findById(@Param('brandId') brandId: string) {
    return await this.brandService.findById(BigInt(brandId));
  }

  @Post()
  @ApiOperation({ summary: 'Create a new brand' })
  @ApiResponse({ status: 201, description: 'Brand created successfully' })
  async create(@Body() createBrandDto: CreateBrandDto) {
    return await this.brandService.create(createBrandDto);
  }

  @Put()
  @ApiOperation({ summary: 'Update a brand' })
  @ApiResponse({ status: 200, description: 'Brand updated successfully' })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  async update(@Body() updateBrandDto: UpdateBrandDto) {
    return await this.brandService.update(updateBrandDto);
  }

  @Get('/categories/:brandId')
  @ApiOperation({ summary: 'Get categories by brand id' })
  @ApiResponse({ status: 200, description: 'Return categories by brand id' })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  async findCategoriesByBrandId(@Param('brandId') brandId: string) {
    return await this.brandService.findCategoriesByBrandId(BigInt(brandId));
  }

  @Delete('/delete/:id')
  @ApiOperation({ summary: 'Delete a brand by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Brand ID' })
  @ApiResponse({ status: 200, description: 'Brand deleted successfully' })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async delete(@Param('id') id: bigint) {
    return await this.brandService.delete(id);
  }
}
