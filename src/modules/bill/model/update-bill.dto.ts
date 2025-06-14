import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional, IsEnum, IsDate } from 'class-validator';
import { UpdateDto } from 'src/modules/base/update.dto';

export class UpdateBillDto extends UpdateDto {
  @ApiProperty({
    description: 'ID de la orden relacionada',
    example: 1,
    type: Number,
    required: false
  })
  @IsOptional()
  @IsNumber()
  orderId?: number;

  /*  @ApiProperty({
     description: 'ID del usuario relacionado',
     example: 1,
     type: Number,
     required: false
   })
   @IsOptional()
   @IsNumber()
   userId?: bigint;
  */
  @ApiProperty({
    description: 'Monto de la factura',
    example: 1160.50,
    type: Number,
    required: false
  })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiProperty({
    description: 'Estado de pago',
    example: 'PAID',
    enum: ['PAID', 'PENDING', 'CANCELLED', 'REFUNDED'],
    required: false
  })
  @IsOptional()
  @IsEnum(['PAID', 'PENDING', 'CANCELLED', 'REFUNDED'])
  paymentStatus?: string;

  @ApiProperty({
    description: 'Concepto de la factura',
    example: 'Compra de productos electrónicos',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString()
  billConcept?: string;

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
  @IsDate()
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
  @IsDate()
  issuedAt?: Date;
}