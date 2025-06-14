import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { UpdateDto } from '../../base/update.dto';
import { stringConstants } from '../../../utils/string.constant';


export class UpdateBrandDto extends UpdateDto {
    @ApiProperty({
        description: 'Nombre de la marca',
        example: 'Samsung',
        type: String,
        required: false
    })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({
        description: 'Descripción de la marca',
        example: 'Samsung es una marca líder en electrónicos',
        type: String,
        required: false
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        description: 'Color de la marca',
        example: '#1428A0',
        type: String,
        required: false
    })
    @IsOptional()
    @IsString()
    color?: string;

    @ApiProperty({
        description: 'URL de la imagen de la marca',
        example: 'https://example.com/brand-image.jpg',
        type: String,
        required: false
    })
    @IsOptional()
    @IsString()
    url?: string;

    @ApiProperty({
        description: 'Estado de la marca',
        example: 'ACTIVE',
        enum: [stringConstants.STATUS_ACTIVE, stringConstants.STATUS_INACTIVE],
        required: false
    })
    @IsOptional()
    @IsEnum([stringConstants.STATUS_ACTIVE, stringConstants.STATUS_INACTIVE])
    status?: string;

    @ApiProperty({
        description: 'Arreglo de ids de las categorías',
        example: [1, 2, 3],
        type: [Number]
    })
    @IsOptional()
    @IsArray()
    categoryIds?: number[];
}
