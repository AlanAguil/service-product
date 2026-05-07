import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UpdateDto } from '../../base/update.dto';

export class UpdateProductDto extends UpdateDto {
  @ApiPropertyOptional({ description: 'The name of the product' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'The description of the product' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'The price of the product' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ description: 'The stock quantity of the product' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;
}
