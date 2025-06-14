import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UpdateDto } from '../../base/update.dto';
import { stringConstants } from '../../../utils/string.constant';

export class UpdateCategoryDto extends UpdateDto {
    @ApiProperty({
        description: 'Nombre de la categoría',
        example: 'Electrónicos',
        type: String,
        required: false
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({
        description: 'Descripción de la categoría',
        example: 'Productos electrónicos de alta calidad',
        type: String,
        required: false
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        description: 'URL de la imagen de la categoría',
        example: 'https://example.com/category-image.jpg',
        type: String,
        required: false
    })
    @IsOptional()
    @IsString()
    url?: string;

    @ApiProperty({
        description: 'Estado de la categoría',
        example: 'ACTIVE',
        enum: [stringConstants.STATUS_ACTIVE, stringConstants.STATUS_INACTIVE],
        required: false
    })
    @IsOptional()
    @IsEnum([stringConstants.STATUS_ACTIVE, stringConstants.STATUS_INACTIVE])
    status?: string;
}
