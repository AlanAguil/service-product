import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Base } from '../../base/entity/base.entity';
import { Order } from '../../order/entity/order.entity';
import { UserEntity } from '../../user/entity/user.entity';

@Entity('bill')
export class Bill extends Base {
  @ApiProperty({
    description: 'ID único de la factura',
    example: 1,
    type: Number
  })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: bigint;

  @ApiProperty({
    description: 'ID de la orden relacionada',
    example: 1,
    type: Number
  })
  @Column({ name: 'order_id', type: 'bigint' })
  orderId: bigint;

  @ApiProperty({
    description: 'Monto de la factura',
    example: 1160.50,
    type: Number
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({
    description: 'Estado de pago',
    example: 'PAID',
    enum: ['PAID', 'PENDING', 'CANCELLED', 'REFUNDED']
  })
  @Column({ 
    name: 'payment_status', 
    type: 'enum', 
    enum: ['PAID', 'PENDING', 'CANCELLED', 'REFUNDED'],
    default: 'PENDING'
  })
  paymentStatus: string;

  @ApiProperty({
    description: 'Concepto de la factura',
    example: 'Compra de productos electrónicos',
    type: String
  })
  @Column({ name: 'bill_concept', type: 'varchar' })
  billConcept: string;

  @ApiProperty({
    description: 'URL del recibo o comprobante',
    example: 'https://example.com/receipts/12345.pdf',
    type: String,
    required: false
  })
  @Column({ name: 'receipt_url', type: 'text', nullable: true })
  receiptUrl: string;

  @ApiProperty({
    description: 'Fecha de notificación',
    example: '2024-05-20T14:00:00.000Z',
    type: Date,
    required: false
  })
  @Column({ name: 'notified_at', type: 'timestamp', nullable: true })
  notifiedAt: Date;

  @ApiProperty({
    description: 'Canal de notificación',
    example: 'EMAIL',
    enum: ['EMAIL', 'SMS', 'PUSH', 'WHATSAPP'],
    required: false
  })
  @Column({ 
    name: 'notification_channel', 
    type: 'enum', 
    enum: ['EMAIL', 'SMS', 'PUSH', 'WHATSAPP'],
    nullable: true
  })
  notificationChannel: string;

  @ApiProperty({
    description: 'Destinatario de la notificación',
    example: 'usuario@ejemplo.com',
    type: String,
    required: false
  })
  @Column({ name: 'notification_recipient', type: 'varchar', nullable: true })
  notificationRecipient: string;

  @ApiProperty({
    description: 'Estado de la notificación',
    example: 'SENT',
    enum: ['SENT', 'DELIVERED', 'READ', 'FAILED'],
    required: false
  })
  @Column({ 
    name: 'notification_status', 
    type: 'enum', 
    enum: ['SENT', 'DELIVERED', 'READ', 'FAILED'],
    nullable: true
  })
  notificationStatus: string;

  @ApiProperty({
    description: 'Fecha de emisión',
    example: '2024-05-20T12:00:00.000Z',
    type: Date,
    required: false
  })
  @Column({ name: 'issued_at', type: 'timestamp', nullable: true })
  issuedAt: Date;

  @ManyToOne(() => Order, order => order.bills)
  @JoinColumn({ name: 'order_id' })
  order: Order;
}
