import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsPositive, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { stringConstants } from 'src/utils/string.constant';

export class UpdateDto {
  @ApiProperty({
    description: 'ID del registro a actualizar',
    example: 1,
    type: Number
  })
  @IsNumber()
  @IsPositive()
  id: bigint;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2024-03-20T14:00:00.000Z',
    type: Date,
    required: false
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  updatedAt?: Date;
} 