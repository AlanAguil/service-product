import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Base } from '../../base/entity/base.entity';
import { stringConstants } from '../../../utils/string.constant';
import { UserEntity } from '../../user/entity/user.entity';
import { OrderHistory } from './order-history.entity';
import { OrderDetail } from '../../order-details/entity/order-details.entity';
import { Bill } from '../../bill/entity/bill.entity';

@Entity('order')
export class Order extends Base {
  @ApiProperty({
    description: 'ID único de la orden',
    example: 1,
    type: Number
  })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: bigint;

  @ApiProperty({
    description: 'ID del usuario que realiza la orden',
    example: 1,
    type: Number
  })
  @Column({ name: 'user_id', type: 'bigint' })
  userId: bigint;

  @ApiProperty({
    description: 'ID del historial de la orden',
    example: 1,
    type: Number
  })
  @Column({ name: 'order_history_id', type: 'bigint' })
  orderHistoryId: bigint;

  @ApiProperty({
    description: 'Guía de envío',
    example: 'GE-12345678',
    type: String,
    required: false
  })
  @Column({ name: 'shipping_guide', type: 'varchar', nullable: true })
  shippingGuide: string;

  @ApiProperty({
    description: 'Estado del envío',
    example: 'En tránsito',
    type: String,
    required: false
  })
  @Column({ name: 'shipping_status', type: 'varchar', nullable: true })
  shippingStatus: string;

  @ApiProperty({
    description: 'Fecha estimada de entrega',
    example: '2024-06-01',
    type: Date,
    required: false
  })
  @Column({ name: 'estimated_delivery_date', type: 'date', nullable: true })
  estimatedDeliveryDate: Date;

  @ApiProperty({
    description: 'Tipo de orden',
    example: 'PURCHASE',
    enum: ['PURCHASE', 'RENTAL', 'SERVICE']
  })
  @Column({
    type: 'enum',
    enum: ['PURCHASE', 'RENTAL', 'SERVICE'],
    default: 'PURCHASE'
  })
  type: string;

  @ApiProperty({
    description: 'Estado de la orden',
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
  @ManyToOne(() => UserEntity, user => user.orders)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @OneToOne(() => OrderHistory, orderHistory => orderHistory.order)
  @JoinColumn({ name: 'order_history_id' })
  orderHistory: OrderHistory;

  @OneToMany(() => OrderDetail, orderDetail => orderDetail.order)
  orderDetails: OrderDetail[];

  @OneToMany(() => Bill, bill => bill.order)
  bills: Bill[];
}
