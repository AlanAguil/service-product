import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { LandingService } from './landing.service';
import { UpdateLandingDto } from './model/update-landing.dto';
import { CreateLandingDto } from './model/create-landing.dto';

@ApiTags('Landing')
@Controller('landing')
export class LandingController {
  constructor(private readonly landingService: LandingService) { }
  /* 
    @Get('/featured-products')
    @ApiOperation({ summary: 'Get featured products for landing page' })
    @ApiResponse({ status: 200, description: 'Return featured products' })
    async getFeaturedProducts() {
      return await this.landingService.getFeaturedProducts();
    }
  
    @Get('/categories')
    @ApiOperation({ summary: 'Get featured categories for landing page' })
    @ApiResponse({ status: 200, description: 'Return featured categories' })
    async getFeaturedCategories() {
      return await this.landingService.getFeaturedCategories();
    }
  
    @Get('/brands')
    @ApiOperation({ summary: 'Get featured brands for landing page' })
    @ApiResponse({ status: 200, description: 'Return featured brands' })
    async getFeaturedBrands() {
      return await this.landingService.getFeaturedBrands();
    }
  
    @Get('/banners')
    @ApiOperation({ summary: 'Get promotional banners for landing page' })
    @ApiResponse({ status: 200, description: 'Return promotional banners' })
    async getBanners() {
      return await this.landingService.getBanners();
    } */


  // ENDPOINTS CORRECTOS SEGÚN EL SERVICE

  @Get()
  @ApiOperation({ summary: 'Obtener todas las landing pages' })
  @ApiResponse({ status: 200, description: 'Listado de todas las landing pages' })
  async findAll() {
    return await this.landingService.findAll();
  }

  @Get('/active')
  @ApiOperation({ summary: 'Obtener todas las landing pages activas' })
  @ApiResponse({ status: 200, description: 'Listado de landing pages activas' })
  async findAllActive() {
    return await this.landingService.findAllActive();
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Obtener landing page por ID' })
  @ApiResponse({ status: 200, description: 'Landing page encontrada' })
  @ApiResponse({ status: 404, description: 'Landing page no encontrada' })
  async findById(@Param('id') id: bigint) {
    return await this.landingService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear una nueva landing page' })
  @ApiResponse({ status: 201, description: 'Landing page creada exitosamente' })
  async create(@Body() createLandingDto: CreateLandingDto) {
    return await this.landingService.create(createLandingDto);
  }

  @Put()
  @ApiOperation({ summary: 'Actualizar una landing page' })
  @ApiResponse({ status: 200, description: 'Landing page actualizada exitosamente' })
  @ApiResponse({ status: 404, description: 'Landing page no encontrada' })
  async update(@Body() updateLandingDto: UpdateLandingDto) {
    return await this.landingService.update(updateLandingDto);
  }

  @Put('/:id/status')
  @ApiOperation({ summary: 'Actualizar el estado de una landing page' })
  @ApiParam({ name: 'id', type: 'number', description: 'Landing ID' })
  @ApiBody({ schema: { example: { status: 'ACTIVE' } } })
  @ApiResponse({ status: 200, description: 'Estado actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Landing page no encontrada' })
  async updateStatus(@Param('id') id: bigint, @Body('status') status: string) {
    return await this.landingService.updateStatus(id, status);
  }

  @Delete('/delete/:id')
  @ApiOperation({ summary: 'Delete a landing by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Landing ID' })
  @ApiResponse({ status: 200, description: 'Landing deleted successfully' })
  @ApiResponse({ status: 404, description: 'Landing not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async delete(@Param('id') id: bigint) {
    return await this.landingService.delete(id);
  }
}
