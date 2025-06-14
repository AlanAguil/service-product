import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UpdateDto } from '../../base/update.dto';
import { stringConstants } from '../../../utils/string.constant';

export class UpdateBillingInfoDto extends UpdateDto {
  @ApiProperty({
    description: 'ID del usuario relacionado',
    example: '1',
    type: String,
    required: false
  })
  @IsOptional()
  userId?: bigint;

  @ApiProperty({
    description: 'Razón social o nombre del negocio',
    example: 'Empresa S.A. de C.V.',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiProperty({
    description: 'RFC',
    example: 'XAXX010101000',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString()
  rfc?: string;

  @ApiProperty({
    description: 'Uso de CFDI',
    example: 'G01',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString()
  cfdiUse?: string;

  @ApiProperty({
    description: 'Régimen fiscal',
    example: '601',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString()
  taxRegime?: string;

  @ApiProperty({
    description: 'Calle',
    example: 'Av. Siempre Viva',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiProperty({
    description: 'Número exterior',
    example: '123',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString()
  exteriorNumber?: string;

  @ApiProperty({
    description: 'Número interior',
    example: 'B',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString()
  interiorNumber?: string;

  @ApiProperty({
    description: 'Colonia',
    example: 'Centro',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiProperty({
    description: 'Ciudad',
    example: 'Ciudad de México',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    description: 'Estado',
    example: 'CDMX',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({
    description: 'Código postal',
    example: '01000',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({
    description: 'Estado de la información de facturación',
    example: 'ACTIVE',
    enum: [stringConstants.STATUS_ACTIVE, stringConstants.STATUS_INACTIVE],
    required: false
  })
  @IsOptional()
  @IsEnum([stringConstants.STATUS_ACTIVE, stringConstants.STATUS_INACTIVE])
  status?: string;
}
