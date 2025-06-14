import { Controller, Get, Post, Put, Body, Param, Query, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto } from './model/create.product.dto';
import { UpdateProductDto } from './model/update.product.dto';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, description: 'Return all products' })
  async findAll() {
    return await this.productService.findAll();
  }

  @Get('/active')
  @ApiOperation({ summary: 'Get all active products' })
  @ApiResponse({ status: 200, description: 'Return all active products' })
  async findAllActive() {
    return await this.productService.findAllActive();
  }

  @Get('/preview')
  @ApiOperation({ summary: 'Get preview of all products' })
  @ApiResponse({ status: 200, description: 'Product previews retrieved successfully' })
  async findPreviewAll() {
    return await this.productService.findPreviewAll();
  }

  @Get('/:productId')
  @ApiOperation({ summary: 'Get product by id' })
  @ApiResponse({ status: 200, description: 'Return product by id' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findById(@Param('productId') productId: string) {
    return await this.productService.findById(BigInt(productId));
  }

  @Get('/brand/:brandId')
  @ApiOperation({ summary: 'Get products by brand id' })
  @ApiResponse({ status: 200, description: 'Return products by brand id' })
  async findByBrandId(@Param('brandId') brandId: string) {
    return await this.productService.findByBrandId(BigInt(brandId));
  }

  @Get('/category/:categoryId')
  @ApiOperation({ summary: 'Get products by category id' })
  @ApiResponse({ status: 200, description: 'Return products by category id' })
  async findByCategoryId(@Param('categoryId') categoryId: string) {
    return await this.productService.findByCategoryId(BigInt(categoryId));
  }

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  async create(@Body() createProductDto: CreateProductDto) {
    return await this.productService.create(createProductDto);
  }

  @Put()
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async update(@Body() updateProductDto: UpdateProductDto) {
    return await this.productService.update(updateProductDto);
  }

  // PUBLIC ENDPOINTS
  @Get('/brand/:brandId/')
  @ApiOperation({ summary: 'Get products by brand' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  async findBrandIdAndActive(@Param('brandId') brandId: number) {
    return await this.productService.findBrandIdAndActive(brandId);
  }

  @Get('/category/:categoryId/brand/:brandId')
  @ApiOperation({ summary: 'Get products by category and brand' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  async findCategoryIdAndBrandIdAndActive(
    @Param('categoryId') categoryId: number,
    @Param('brandId') brandId: number,
  ) {
    return await this.productService.findCategoryIdAndBrandIdAndActive(categoryId, brandId);
  }

  @Get('/active/:productId')
  @ApiOperation({ summary: 'Get active product by ID' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  async findByIdAndActive(@Param('productId') productId: number) {
    return await this.productService.findByIdAndActive(productId);
  }

  @Delete('/delete/:id')
  @ApiOperation({ summary: 'Delete a product by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async delete(@Param('id') id: bigint) {
    return await this.productService.delete(id);
  }

  @Get('/stats/inventory')
  @ApiOperation({ summary: 'Get inventory statistics' })
  @ApiResponse({ status: 200, description: 'Inventory statistics retrieved successfully' })
  async getInventoryStats() {
    return await this.productService.getInventoryStats();
  }

  @Get('/stats/top-selling')
  @ApiOperation({ summary: 'Get top selling products' })
  @ApiResponse({ status: 200, description: 'Top selling products retrieved successfully' })
  async getTopSellingProducts(@Query('limit') limit?: number) {
    return await this.productService.getTopSellingProducts(limit);
  }
}
