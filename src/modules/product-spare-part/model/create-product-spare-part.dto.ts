import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CreateDto } from '../../base/create.dto';

export class CreateProductSparePartDto extends CreateDto {
  @ApiProperty({
    description: 'ID del producto',
    example: '1',
    type: String
  })
  @IsNotEmpty()
  productId: bigint;

  @ApiProperty({
    description: 'ID del repuesto',
    example: '1',
    type: String
  })
  @IsNotEmpty()
  sparePartId: bigint;

  @ApiProperty({
    description: 'Notas de compatibilidad',
    example: 'Compatible con modelos de 2021 a 2023',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString()
  compatibilityNotes?: string;
}
