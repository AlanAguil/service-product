import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';

export class CreateLandingDto {
  @ApiProperty({ description: 'Landing page title', example: 'Main Sale' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Landing page description', example: 'Special offers for summer' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Landing type', example: 'PROMO', required: false })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({
    description: 'Landing status',
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  })
  @IsEnum(['ACTIVE', 'INACTIVE'])
  status: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';

  @ApiProperty({
    description: 'URL de la imagen de la categoría',
    example: 'https://example.com/category-image.jpg',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString()
  url?: string;
}