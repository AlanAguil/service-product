import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class UploadFilesDto {
  @ApiProperty({
    description: 'ID de la compañía',
    example: '123',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  companyId: string;
} 