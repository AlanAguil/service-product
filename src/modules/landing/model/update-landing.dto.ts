import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateLandingDto {
    @ApiProperty({ description: 'Landing page ID', example: 1, type: Number })
    @IsNotEmpty()
    @IsNumber()
    id: bigint;

    @ApiProperty({ description: 'Landing page title', example: 'Main Sale', required: false })
    @IsString()
    @IsOptional()
    title?: string;

    @ApiProperty({ description: 'Landing page description', example: 'Special offers for summer', required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ description: 'Landing type', example: 'PROMO', required: false })
    @IsString()
    @IsOptional()
    type?: string;

    @ApiProperty({
        description: 'Landing status',
        enum: ['ACTIVE', 'INACTIVE'],
        required: false
    })
    @IsEnum(['ACTIVE', 'INACTIVE'])
    @IsOptional()
    status?: 'ACTIVE' | 'INACTIVE';

    @ApiProperty({ description: 'URL de la imagen del landing', example: 'https://example.com/landing-image.jpg', type: String, required: false })
    @IsOptional()
    @IsString()
    url?: string;
}