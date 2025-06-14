import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
    @ApiProperty({
        description: 'Email del usuario',
        example: 'usuario@ejemplo.com',
        type: String,
        required: false
    })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({
        description: 'Nombre del usuario',
        example: 'Juan',
        type: String,
        required: false
    })
    @IsOptional()
    @IsString()
    name?: string;
} 