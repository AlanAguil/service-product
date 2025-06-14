import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';

export class UpdateBrandCategoryDto {
    @ApiProperty({ description: 'Relationship ID', example: 1, type: Number })
    @IsNotEmpty()
    @IsNumber()
    id: bigint;

    @ApiProperty({ description: 'Brand ID', example: 1, type: Number })
    @IsNumber()
    brandId: bigint;

    @ApiProperty({ description: 'Category ID', example: 1, type: Number })
    @IsNumber()
    categoryId: bigint;
}