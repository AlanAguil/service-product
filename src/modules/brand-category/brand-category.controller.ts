import { Controller, Get, Post, Put, Body, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { BrandCategoryService } from './brand-category.service';
import { CreateBrandCategoryDto } from './model/create-brand-category.dto';
import { UpdateBrandCategoryDto } from './model/update-brand-category.dto';

@ApiTags('Brand Categories')
@Controller('brand-categories')
export class BrandCategoryController {
  constructor(private readonly brandCategoryService: BrandCategoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all brand-category relationships' })
  @ApiResponse({ status: 200, description: 'Return all brand-category relationships' })
  async findAll() {
    return await this.brandCategoryService.findAll();
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get brand-category relationship by id' })
  @ApiResponse({ status: 200, description: 'Return brand-category relationship by id' })
  @ApiResponse({ status: 404, description: 'Brand-category relationship not found' })
  async findById(@Param('id') id: string) {
    return await this.brandCategoryService.findById(BigInt(id));
  }

  @Get('/brand/:brandId')
  @ApiOperation({ summary: 'Get all categories for a specific brand' })
  @ApiResponse({ status: 200, description: 'Return all categories for the specified brand' })
  async findByBrandId(@Param('brandId') brandId: string) {
    return await this.brandCategoryService.findByBrandId(BigInt(brandId));
  }

  @Get('/category/:categoryId')
  @ApiOperation({ summary: 'Get all brands for a specific category' })
  @ApiResponse({ status: 200, description: 'Return all brands for the specified category' })
  async findByCategoryId(@Param('categoryId') categoryId: string) {
    return await this.brandCategoryService.findByCategoryId(BigInt(categoryId));
  }

  @Post()
  @ApiOperation({ summary: 'Create multiple brand-category relationships' })
  @ApiResponse({ status: 201, description: 'Brand-category relationships created successfully' })
  async bulkCreate(@Body() createBrandCategoryDtos: CreateBrandCategoryDto[]) {
    return await this.brandCategoryService.bulkCreate(createBrandCategoryDtos);
  }

  @Put()
  @ApiOperation({ summary: 'Update a brand-category relationship' })
  @ApiResponse({ status: 200, description: 'Brand-category relationship updated successfully' })
  @ApiResponse({ status: 404, description: 'Brand-category relationship not found' })
  async update(@Body() updateBrandCategoryDto: UpdateBrandCategoryDto) {
    return await this.brandCategoryService.update(updateBrandCategoryDto);
  }

  @Delete('/delete/:id')
  @ApiOperation({ summary: 'Delete a brand-category relationship by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Brand-Category Relationship ID' })
  @ApiResponse({ status: 200, description: 'Brand-category relationship deleted successfully' })
  @ApiResponse({ status: 404, description: 'Brand-category relationship not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async delete(@Param('id') id: bigint) {
    return await this.brandCategoryService.delete(id);
  }
} 