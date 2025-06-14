import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateOrderDetailDto {
    @ApiProperty({ description: 'Order ID', example: 1, type: Number })
    @IsNumber()
    orderId: bigint;

    @ApiProperty({ description: 'Product ID', example: 1, type: Number })
    @IsNumber()
    productId: bigint;

    @ApiProperty({ description: 'Quantity', example: 2 })
    @IsNumber()
    quantity: number;

    @ApiProperty({ description: 'Unit price', example: 100.5 })
    @IsNumber()
    unitPrice: number;

    @ApiProperty({ description: 'Discount', example: 10 })
    @IsNumber()
    discount: number;

    @ApiProperty({ description: 'Total', example: 191 })
    @IsNumber()
    total: number;
}