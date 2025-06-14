import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CreateDto } from '../../base/create.dto';
import { stringConstants } from '../../../utils/string.constant';

export class CreateBillingInfoDto extends CreateDto {
  @ApiProperty({
    description: 'ID del usuario relacionado',
    example: '1',
    type: String
  })
  @IsNotEmpty()
  userId: bigint;

  @ApiProperty({
    description: 'Razón social o nombre del negocio',
    example: 'Empresa S.A. de C.V.',
    type: String
  })
  @IsNotEmpty()
  @IsString()
  businessName: string;

  @ApiProperty({
    description: 'RFC',
    example: 'XAXX010101000',
    type: String
  })
  @IsNotEmpty()
  @IsString()
  rfc: string;

  @ApiProperty({
    description: 'Uso de CFDI',
    example: 'G01',
    type: String
  })
  @IsNotEmpty()
  @IsString()
  cfdiUse: string;

  @ApiProperty({
    description: 'Régimen fiscal',
    example: '601',
    type: String
  })
  @IsNotEmpty()
  @IsString()
  taxRegime: string;

  @ApiProperty({
    description: 'Calle',
    example: 'Av. Siempre Viva',
    type: String
  })
  @IsNotEmpty()
  @IsString()
  street: string;

  @ApiProperty({
    description: 'Número exterior',
    example: '123',
    type: String
  })
  @IsNotEmpty()
  @IsString()
  exteriorNumber: string;

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
    type: String
  })
  @IsNotEmpty()
  @IsString()
  neighborhood: string;

  @ApiProperty({
    description: 'Ciudad',
    example: 'Ciudad de México',
    type: String
  })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({
    description: 'Estado',
    example: 'CDMX',
    type: String
  })
  @IsNotEmpty()
  @IsString()
  state: string;

  @ApiProperty({
    description: 'Código postal',
    example: '01000',
    type: String
  })
  @IsNotEmpty()
  @IsString()
  postalCode: string;

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
