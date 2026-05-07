import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateDto } from '../../base/create.dto';

export class CreateProductDto extends CreateDto {
  @ApiProperty({ description: 'The name of the product' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'The description of the product' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'The price of the product' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'The stock quantity of the product' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;
}
