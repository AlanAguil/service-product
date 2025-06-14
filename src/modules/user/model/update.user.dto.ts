import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UpdateDto } from '../../base/update.dto';
import { stringConstants } from '../../../utils/string.constant';

export class UpdateUserDto extends UpdateDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@ejemplo.com',
    type: String,
    required: false
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Pérez',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'Contraseña123',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({
    description: 'Número telefónico del usuario',
    example: '5512345678',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Rol del usuario en el sistema',
    example: 'CUSTOMER',
    enum: [
      stringConstants.ADMIN,
      stringConstants.MANAGER,
      stringConstants.FREQUENT_CUSTOMER,
      stringConstants.GENERAL_CUSTOMER
    ],
    required: false
  })
  @IsOptional()
  @IsEnum([
    stringConstants.ADMIN,
    stringConstants.MANAGER,
    stringConstants.FREQUENT_CUSTOMER,
    stringConstants.GENERAL_CUSTOMER
  ])
  role?: string;

  @ApiProperty({
    description: 'Estado del usuario',
    example: 'ACTIVE',
    enum: [stringConstants.STATUS_ACTIVE, stringConstants.STATUS_INACTIVE],
    required: false
  })
  @IsOptional()
  @IsEnum([stringConstants.STATUS_ACTIVE, stringConstants.STATUS_INACTIVE])
  status?: string;
}
