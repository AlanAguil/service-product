import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GenerateDescriptionDto {
    @ApiProperty({
        description: 'Consulta del producto para generar la descripción',
        example: 'Martillo de carpintero profesional con mango de fibra de vidrio'
    })
    @IsNotEmpty({ message: 'La consulta del producto es requerida' })
    @IsString({ message: 'La consulta debe ser una cadena de texto' })
    query: string;
}