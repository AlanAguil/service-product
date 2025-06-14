import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { UpdateDto } from '../../base/update.dto';
import { stringConstants } from '../../../utils/string.constant';
import { Type } from 'class-transformer';
import { UpdateMediaDTO } from 'src/modules/media/model/update.media.dto';

export class UpdateSparePartDto extends UpdateDto {
  @ApiProperty({
    description: 'ID externo del repuesto',
    example: 'SP-12345',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiProperty({
    description: 'Código del repuesto',
    example: 'RP-ABC-123',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({
    description: 'Nombre del repuesto',
    example: 'Pantalla OLED Galaxy S21',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Descripción detallada del repuesto',
    example: 'Pantalla OLED original para Samsung Galaxy S21...',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Material del repuesto',
    example: 'Vidrio, plástico y componentes electrónicos',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString()
  material?: string;

  @ApiProperty({
    description: 'Precio de venta',
    example: 2999.99,
    type: Number,
    required: false
  })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({
    description: 'Cantidad en inventario',
    example: 25,
    type: Number,
    required: false
  })
  @IsOptional()
  @IsNumber()
  stock?: number;

  @ApiProperty({
    description: 'Indica si el repuesto está disponible para renta',
    example: false,
    type: Boolean,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  rentable?: boolean;

  @ApiProperty({
    description: 'Estado del repuesto',
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
