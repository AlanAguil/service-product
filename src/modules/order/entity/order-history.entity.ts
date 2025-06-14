import { Entity, Column, PrimaryGeneratedColumn, OneToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Base } from '../../base/entity/base.entity';
import { Order } from './order.entity';

@Entity('order_history')
export class OrderHistory extends Base {
  @ApiProperty({
    description: 'ID único del historial de la orden',
    example: 1,
    type: Number
  })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: bigint;

  @ApiProperty({
    description: 'ID de la transacción',
    example: 'TX-12345-ABCDE',
    type: String
  })
  @Column({ name: 'transaction_id', type: 'varchar' })
  transactionId: string;

  @ApiProperty({
    description: 'Nombre del receptor',
    example: 'Juan Pérez',
    type: String
  })
  @Column({ type: 'varchar' })
  receiver: string;

  @ApiProperty({
    description: 'Dirección completa de envío',
    example: 'Calle Siempre Viva 123, Col. Centro',
    type: String
  })
  @Column({ name: 'shipping_full_address', type: 'varchar' })
  shippingFullAddress: string;

  @ApiProperty({
    description: 'Ciudad de envío',
    example: 'Ciudad de México',
    type: String
  })
  @Column({ name: 'shipping_city', type: 'varchar' })
  shippingCity: string;

  @ApiProperty({
    description: 'Estado de envío',
    example: 'CDMX',
    type: String
  })
  @Column({ name: 'shipping_state', type: 'varchar' })
  shippingState: string;

  @ApiProperty({
    description: 'Código postal de envío',
    example: '01000',
    type: String
  })
  @Column({ name: 'shipping_postal_code', type: 'varchar' })
  shippingPostalCode: string;

  @ApiProperty({
    description: 'Teléfono de contacto para envío',
    example: '5512345678',
    type: String
  })
  @Column({ name: 'shipping_phone_number', type: 'varchar' })
  shippingPhoneNumber: string;

  @ApiProperty({
    description: 'Costo de envío',
    example: 150.0,
    type: Number
  })
  @Column({ name: 'shipping_cost', type: 'double precision' })
  shippingCost: number;

  @ApiProperty({
    description: 'Razón social',
    example: 'Empresa S.A. de C.V.',
    type: String,
    required: false
  })
  @Column({ name: 'business_name', type: 'varchar', nullable: true })
  businessName: string;

  @ApiProperty({
    description: 'RFC',
    example: 'XAXX010101000',
    type: String,
    required: false
  })
  @Column({ type: 'varchar', nullable: true })
  rfc: string;

  @ApiProperty({
    description: 'Uso de CFDI',
    example: 'G01',
    type: String,
    required: false
  })
  @Column({ name: 'cfdi_use', type: 'varchar', nullable: true })
  cfdiUse: string;

  @ApiProperty({
    description: 'Régimen fiscal',
    example: '601',
    type: String,
    required: false
  })
  @Column({ name: 'tax_regime', type: 'varchar', nullable: true })
  taxRegime: string;

  @ApiProperty({
    description: 'Dirección completa de facturación',
    example: 'Calle Reforma 456, Col. Juárez',
    type: String,
    required: false
  })
  @Column({ name: 'billing_full_address', type: 'varchar', nullable: true })
  billingFullAddress: string;

  @ApiProperty({
    description: 'Últimos cuatro dígitos de la tarjeta',
    example: '1234',
    type: String,
    required: false
  })
  @Column({ name: 'last_four_digits', type: 'varchar', nullable: true })
  lastFourDigits: string;

  @ApiProperty({
    description: 'Método de pago',
    example: 'CREDIT_CARD',
    type: String
  })
  @Column({ name: 'payment_method', type: 'enum', enum: ['CREDIT_CARD', 'DEBIT_CARD', 'CASH', 'BANK_TRANSFER'] })
  paymentMethod: string;

  @ApiProperty({
    description: 'Proveedor de pago',
    example: 'Stripe',
    type: String,
    required: false
  })
  @Column({ name: 'payment_provider', type: 'varchar', nullable: true })
  paymentProvider: string;

  @ApiProperty({
    description: 'Subtotal de la orden',
    example: 1000.0,
    type: Number
  })
  @Column({ type: 'double precision' })
  subtotal: number;

  @ApiProperty({
    description: 'Impuesto aplicado',
    example: 160.0,
    type: Number
  })
  @Column({ type: 'double precision' })
  tax: number;

  @ApiProperty({
    description: 'Total de la orden',
    example: 1160.0,
    type: Number
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  // Relaciones
  @OneToOne(() => Order, order => order.orderHistory)
  order: Order;
} 