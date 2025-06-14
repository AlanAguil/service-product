import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateDto } from '../../base/update.dto';
import { stringConstants } from '../../../utils/string.constant';
import { UpdateMediaDTO } from '../../media/model/update.media.dto';
import { KeyValuePair } from '../transformers/interfaces';
import { KeyValuePairDto } from './create.product.dto';

export class UpdateProductDto extends UpdateDto {
  @ApiProperty({
    description: 'ID de la marca relacionada',
    example: '1',
    type: String,
    required: false
  })
  @IsOptional()
  brandId?: bigint;

  @ApiProperty({
    description: 'ID de la categoría relacionada',
    example: '1',
    type: String,
    required: false
  })
  @IsOptional()
  categoryId?: bigint;

  @ApiProperty({
    description: 'ID externo del producto',
    example: 'PROD-12345',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Smartphone Galaxy S21',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Descripción corta del producto',
    example: 'Smartphone de última generación',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiProperty({
    description: 'Descripción detallada del producto',
    example: 'El Galaxy S21 cuenta con una pantalla de 6.2 pulgadas...',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Funcionalidades del producto',
    example: ['Reconocimiento facial', 'Resistente al agua', 'Carga inalámbrica'],
    type: [String],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  functionalities?: string[];

  @ApiProperty({
    description: 'Datos técnicos del producto',
    example: [
      { key: 'Potencia', value: '550w' },
      { key: 'Voltaje', value: '128v' }
    ],
    type: [KeyValuePairDto],
    required: false
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KeyValuePairDto)
  technicalData?: KeyValuePair[];

  @ApiProperty({
    description: 'Tipo de producto',
    example: 'Smartphone',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({
    description: 'Uso recomendado del producto',
    example: 'Personal/Empresarial',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString()
  productUsage?: string;

  @ApiProperty({
    description: 'Precio de venta',
    example: 14999.99,
    type: Number,
    required: false
  })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({
    description: 'Costo del producto',
    example: 10000.0,
    type: Number,
    required: false
  })
  @IsOptional()
  @IsNumber()
  cost?: number;

  @ApiProperty({
    description: 'Descuento aplicado al producto',
    example: 1500.0,
    type: Number,
    required: false
  })
  @IsOptional()
  @IsNumber()
  discount?: number;

  @ApiProperty({
    description: 'Cantidad en inventario',
    example: 50,
    type: Number,
    required: false
  })
  @IsOptional()
  @IsNumber()
  stock?: number;

  @ApiProperty({
    description: 'Período de garantía en meses',
    example: 12,
    type: Number,
    required: false
  })
  @IsOptional()
  @IsNumber()
  garanty?: number;

  @ApiProperty({
    description: 'Color del producto',
    example: 'Negro',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({
    description: 'Enlaces de descarga (manuales, drivers, etc.)',
    example: [
      { key: 'Manual de usuario', value: 'https://example.com/manuales/s21.pdf' },
      { key: 'Drivers', value: 'https://example.com/drivers/s21.zip' }
    ],
    type: [KeyValuePairDto],
    required: false
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KeyValuePairDto)
  downloads?: KeyValuePair[];

  @ApiProperty({
    description: 'Indica si el producto está disponible para renta',
    example: true,
    type: Boolean,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  rentable?: boolean;

  @ApiProperty({
    description: 'Estado del producto',
    example: 'ACTIVE',
    enum: [stringConstants.STATUS_ACTIVE, stringConstants.STATUS_INACTIVE],
    required: false
  })
  @IsOptional()
  @IsEnum([stringConstants.STATUS_ACTIVE, stringConstants.STATUS_INACTIVE])
  status?: string;
  
  @ApiProperty({
    description: 'Archivos multimedia relacionados al producto',
    type: [UpdateMediaDTO],
    required: false
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateMediaDTO)
  media?: UpdateMediaDTO[];
}
