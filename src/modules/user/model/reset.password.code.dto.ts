import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ResetPasswordCodeDTO {
  @ApiProperty({ description: 'ID del usuario' })
  @IsNotEmpty()
  id: bigint;

  @ApiProperty({ description: 'Código de verificación' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Nueva contraseña' })
  @IsString()
  @IsNotEmpty()
  password: string;
} 