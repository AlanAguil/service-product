import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional, IsEnum, IsDate, IsISO8601 } from 'class-validator';
import { CreateDto } from 'src/modules/base/create.dto';

export class CreateBillDto extends CreateDto {
  @ApiProperty({
    description: 'ID de la orden relacionada',
    example: 1,
    type: Number
  })
  @IsNotEmpty()
  @IsNumber()
  orderId: bigint;


  @ApiProperty({
    description: 'Monto de la factura',
    example: 1160.50,
    type: Number
  })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Estado de pago',
    example: 'PAID',
    enum: ['PAID', 'PENDING', 'CANCELLED', 'REFUNDED']
  })
  @IsNotEmpty()
  @IsEnum(['PAID', 'PENDING', 'CANCELLED', 'REFUNDED'])
  paymentStatus: string;

  @ApiProperty({
    description: 'Concepto de la factura',
    example: 'Compra de productos electrónicos',
    type: String
  })
  @IsNotEmpty()
  @IsString()
  billConcept: string;

  @ApiProperty({
    description: 'URL del recibo o comprobante',
    example: 'https://example.com/receipts/12345.pdf',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @ApiProperty({
    description: 'Fecha de notificación',
    example: '2024-05-20T14:00:00.000Z',
    type: Date,
    required: false
  })
  @IsOptional()
  @IsISO8601()
  notifiedAt?: Date;

  @ApiProperty({
    description: 'Canal de notificación',
    example: 'EMAIL',
    enum: ['EMAIL', 'SMS', 'PUSH', 'WHATSAPP'],
    required: false
  })
  @IsOptional()
  @IsEnum(['EMAIL', 'SMS', 'PUSH', 'WHATSAPP'])
  notificationChannel?: string;

  @ApiProperty({
    description: 'Destinatario de la notificación',
    example: 'usuario@ejemplo.com',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString()
  notificationRecipient?: string;

  @ApiProperty({
    description: 'Estado de la notificación',
    example: 'SENT',
    enum: ['SENT', 'DELIVERED', 'READ', 'FAILED'],
    required: false
  })
  @IsOptional()
  @IsEnum(['SENT', 'DELIVERED', 'READ', 'FAILED'])
  notificationStatus?: string;

  @ApiProperty({
    description: 'Fecha de emisión',
    example: '2024-05-20T12:00:00.000Z',
    type: Date,
    required: false
  })
  @IsOptional()
  @IsISO8601()
  issuedAt?: Date;
}