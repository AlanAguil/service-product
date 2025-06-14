import { Controller, Get, Post, Put, Body, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SparePartService } from './spare-part.service';
import { CreateSparePartDto } from './model/create.spare-part.dto';
import { UpdateSparePartDto } from './model/update.spare-part.dto';

@ApiTags('Spare Parts')
@Controller('spare-parts')
export class SparePartController {
  constructor(private readonly sparePartService: SparePartService) {}

  @Get()
  @ApiOperation({ summary: 'Get all spare parts' })
  @ApiResponse({ status: 200, description: 'Return all spare parts' })
  async findAll() {
    return await this.sparePartService.findAll();
  }

  @Get('/active')
  @ApiOperation({ summary: 'Get all active spare parts' })
  @ApiResponse({ status: 200, description: 'Return all active spare parts' })
  async findAllActive() {
    return await this.sparePartService.findAllActive();
  }

  @Get('/:sparePartId')
  @ApiOperation({ summary: 'Get spare part by id' })
  @ApiResponse({ status: 200, description: 'Return spare part by id' })
  @ApiResponse({ status: 404, description: 'Spare part not found' })
  async findById(@Param('sparePartId') sparePartId: string) {
    return await this.sparePartService.findById(BigInt(sparePartId));
  }

  @Post()
  @ApiOperation({ summary: 'Create a new spare part' })
  @ApiResponse({ status: 201, description: 'Spare part created successfully' })
  async create(@Body() createSparePartDto: CreateSparePartDto) {
    return await this.sparePartService.create(createSparePartDto);
  }

  @Put()
  @ApiOperation({ summary: 'Update a spare part' })
  @ApiResponse({ status: 200, description: 'Spare part updated successfully' })
  @ApiResponse({ status: 404, description: 'Spare part not found' })
  async update(@Body() updateSparePartDto: UpdateSparePartDto) {
    return await this.sparePartService.update(updateSparePartDto);
  }

  @Delete('/delete/:id')
  @ApiOperation({ summary: 'Delete a spare part by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Spare Part ID' })
  @ApiResponse({ status: 200, description: 'Spare part deleted successfully' })
  @ApiResponse({ status: 404, description: 'Spare part not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async delete(@Param('id') id: bigint) {
    return await this.sparePartService.delete(id);
  }
}
