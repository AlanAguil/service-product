import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { UpdateDto } from '../../base/update.dto';

export class UpdateProductSparePartDto extends UpdateDto {
  @ApiProperty({
    description: 'ID del producto',
    example: '1',
    type: String,
    required: false
  })
  @IsOptional()
  productId?: bigint;

  @ApiProperty({
    description: 'ID del repuesto',
    example: '1',
    type: String,
    required: false
  })
  @IsOptional()
  sparePartId?: bigint;

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
