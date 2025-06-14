import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDto {
  @ApiProperty({
    description: 'Usuario que crea el registro',
    example: '1',
    type: String,
    required: false
  })
  @IsString()
  @IsOptional()
  createdBy?: string;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2024-03-20T14:00:00.000Z',
    type: Date,
    required: false
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  createdAt?: Date;
} 