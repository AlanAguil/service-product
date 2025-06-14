import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateMediaDTO {
  @ApiProperty({ description: 'ID del media (requerido para updates)' })
  @IsNotEmpty()
  id: bigint;

  @ApiProperty({ description: 'URL pública del archivo', required: false })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiProperty({ 
    description: 'Tipo de archivo',
    enum: ['IMAGE', 'PDF', 'VIDEO', 'OTHER'],
    required: false
  })
  @IsEnum(['IMAGE', 'PDF', 'VIDEO', 'OTHER'])
  @IsOptional()
  fileType?: 'IMAGE' | 'PDF' | 'VIDEO' | 'OTHER';

  @ApiProperty({ description: 'ID de la entidad relacionada', required: false })
  @IsOptional()
  entityId?: bigint;

  @ApiProperty({ 
    description: 'Tipo de entidad',
    enum: ['PRODUCT', 'SPARE_PART'],
    required: false
  })
  @IsEnum(['PRODUCT', 'SPARE_PART'])
  @IsOptional()
  entityType?: 'PRODUCT' | 'SPARE_PART';

  @ApiProperty({ description: 'Orden de aparición', required: false })
  @IsNumber()
  @IsOptional()
  displayOrder?: number;
} 