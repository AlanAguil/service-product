import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateBrandCategoryDto {
  @ApiProperty({ description: 'Brand ID', example: 1, type: Number })
  @IsNumber()
  brandId: bigint;

  @ApiProperty({ description: 'Category ID', example: 1, type: Number })
  @IsNumber()
  categoryId: bigint;
}