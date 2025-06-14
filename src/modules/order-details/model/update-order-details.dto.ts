import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateOrderDetailDto {
    @ApiProperty({ description: 'Order detail ID', example: 1, type: Number })
    @IsNotEmpty()
    @IsNumber()
    id: bigint;

    @ApiProperty({ description: 'Order ID', example: 1, type: Number, required: false })
    @IsNumber()
    @IsOptional()
    orderId?: bigint;

    @ApiProperty({ description: 'Product ID', example: 1, type: Number, required: false })
    @IsNumber()
    @IsOptional()
    productId?: bigint;

    @ApiProperty({ description: 'Quantity', example: 2, required: false })
    @IsNumber()
    @IsOptional()
    quantity?: number;

    @ApiProperty({ description: 'Unit price', example: 100.5, required: false })
    @IsNumber()
    @IsOptional()
    unitPrice?: number;

    @ApiProperty({ description: 'Discount', example: 10, required: false })
    @IsNumber()
    @IsOptional()
    discount?: number;
}