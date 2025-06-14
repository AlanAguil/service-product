import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsISO8601, IsNotEmpty, IsEnum } from 'class-validator';
import { stringConstants } from '../../../utils/string.constant';

export class UpdateOrderDto {
    @ApiProperty({ description: 'Order ID', example: 1, type: Number })
    @IsNotEmpty()
    @IsNumber()
    id: bigint;

    @ApiProperty({ description: 'User ID', example: 1, type: Number, required: false })
    @IsNumber()
    @IsOptional()
    userId?: bigint;

    @ApiProperty({ 
        description: 'Tipo de orden',
        example: 'PURCHASE',
        enum: ['PURCHASE', 'RENTAL', 'SERVICE'],
        required: false
    })
    @IsEnum(['PURCHASE', 'RENTAL', 'SERVICE'])
    @IsOptional()
    type?: 'PURCHASE' | 'RENTAL' | 'SERVICE';

    @ApiProperty({ 
        description: 'Estado de la orden',
        example: 'ACTIVE',
        enum: [stringConstants.STATUS_ACTIVE, stringConstants.STATUS_INACTIVE],
        required: false
    })
    @IsEnum([stringConstants.STATUS_ACTIVE, stringConstants.STATUS_INACTIVE])
    @IsOptional()
    status?: string;

    @ApiProperty({ description: 'Shipping guide', example: 'ABC123', required: false })
    @IsString()
    @IsOptional()
    shippingGuide?: string;

    @ApiProperty({ description: 'Shipping status', example: 'SHIPPED', required: false })
    @IsString()
    @IsOptional()
    shippingStatus?: string;

    @ApiProperty({
        description: 'Estimated delivery date (ISO8601 string)',
        example: '2024-06-20T00:00:00.000Z',
        required: false
    })
    @IsISO8601()
    @IsOptional()
    estimatedDeliveryDate?: string;
}