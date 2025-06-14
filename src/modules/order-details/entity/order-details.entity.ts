import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Base } from '../../base/entity/base.entity';
import { stringConstants } from '../../../utils/string.constant';
import { Order } from '../../order/entity/order.entity';
import { Product } from '../../product/entity/product.entity';

@Entity('order_detail')
export class OrderDetail extends Base {
  @ApiProperty({
    description: 'ID único del detalle de orden',
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
    description: 'ID del producto relacionado',
    example: 1,
    type: Number
  })
  @Column({ name: 'product_id', type: 'bigint' })
  productId: bigint;

  @ApiProperty({
    description: 'Cantidad de productos',
    example: 2,
    type: Number
  })
  @Column({ type: 'int' })
  quantity: number;

  @ApiProperty({
    description: 'Precio unitario',
    example: 499.99,
    type: Number
  })
  @Column({ name: 'unit_price', type: 'double precision' })
  unitPrice: number;

  @ApiProperty({
    description: 'Descuento aplicado',
    example: 50.0,
    type: Number
  })
  @Column({ type: 'double precision' })
  discount: number;

  @ApiProperty({
    description: 'Total del detalle',
    example: 949.98,
    type: Number
  })
  @Column({ type: 'double precision' })
  total: number;

  @ApiProperty({
    description: 'Estado del detalle de orden',
    example: 'ACTIVE',
    enum: [stringConstants.STATUS_ACTIVE, stringConstants.STATUS_INACTIVE]
  })
  @Column({
    type: 'enum',
    enum: [stringConstants.STATUS_ACTIVE, stringConstants.STATUS_INACTIVE],
    default: stringConstants.STATUS_ACTIVE
  })
  status: string;

  // Relaciones
  @ManyToOne(() => Order, order => order.orderDetails)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Product, product => product.orderDetails)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
