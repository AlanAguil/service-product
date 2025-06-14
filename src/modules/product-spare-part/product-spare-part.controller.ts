import { Controller, Get, Post, Put, Body, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ProductSparePartService } from './product-spare-part.service';
import { CreateProductSparePartDto } from './model/create-product-spare-part.dto';
import { UpdateProductSparePartDto } from './model/update-product-spare-part.dto';

@ApiTags('Product Spare Parts')
@Controller('product-spare-parts')
export class ProductSparePartController {
  constructor(private readonly productSparePartService: ProductSparePartService) { }

  @Get()
  @ApiOperation({ summary: 'Get all product-spare-part relationships' })
  @ApiResponse({ status: 200, description: 'Return all product-spare-part relationships' })
  async findAll() {
    return await this.productSparePartService.findAll();
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get product-spare-part relationship by id' })
  @ApiResponse({ status: 200, description: 'Return product-spare-part relationship by id' })
  @ApiResponse({ status: 404, description: 'Relationship not found' })
  async findById(@Param('id') id: string) {
    return await this.productSparePartService.findById(BigInt(id));
  }

  @Post()
  @ApiOperation({ summary: 'Create a new product-spare-part relationship' })
  @ApiResponse({ status: 201, description: 'Relationship created successfully' })
  async create(@Body() createProductSparePartDto: CreateProductSparePartDto) {
    return await this.productSparePartService.create(createProductSparePartDto);
  }

  @Put()
  @ApiOperation({ summary: 'Update a product-spare-part relationship' })
  @ApiResponse({ status: 200, description: 'Relationship updated successfully' })
  @ApiResponse({ status: 404, description: 'Relationship not found' })
  async update(@Body() updateProductSparePartDto: UpdateProductSparePartDto) {
    return await this.productSparePartService.update(updateProductSparePartDto);
  } 
  
  @Delete('/delete/:id')
  @ApiOperation({ summary: 'Delete a product-spare-part relationship by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Product-Spare-Part Relationship ID' })
  @ApiResponse({ status: 200, description: 'Product-spare-part relationship deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product-spare-part relationship not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async delete(@Param('id') id: bigint) {
    return await this.productSparePartService.delete(id);
  }
}
