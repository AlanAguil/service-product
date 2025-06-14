import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CreateDto } from '../../base/create.dto';
import { stringConstants } from '../../../utils/string.constant';

export class CreateShippingAddressDto extends CreateDto {
  @ApiProperty({
    description: 'ID del usuario relacionado',
    example: '1',
    type: String
  })
  @IsNotEmpty()
  userId: bigint;

  @ApiProperty({
    description: 'Nombre del receptor',
    example: 'Juan Pérez',
    type: String
  })
  @IsNotEmpty()
  @IsString()
  receiver: string;

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
    description: 'Número de teléfono para contacto',
    example: '5512345678',
    type: String
  })
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @ApiProperty({
    description: 'Referencias para ubicar el domicilio',
    example: 'Casa azul con rejas blancas',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString()
  referencesText?: string;

  @ApiProperty({
    description: 'Indica si es la dirección seleccionada por defecto',
    example: true,
    type: Boolean,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isSelected?: boolean;

  @ApiProperty({
    description: 'Estado de la dirección de envío',
    example: 'ACTIVE',
    enum: [stringConstants.STATUS_ACTIVE, stringConstants.STATUS_INACTIVE],
    required: false
  })
  @IsOptional()
  @IsEnum([stringConstants.STATUS_ACTIVE, stringConstants.STATUS_INACTIVE])
  status?: string;
}
