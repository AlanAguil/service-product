import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Base } from '../../base/entity/base.entity';
import { stringConstants } from '../../../utils/string.constant';
import { BillingInfo } from '../../billing-info/entity/billing-info.entity';
import { ShippingAddress } from '../../shipping-address/entity/shipping-address.entity';
import { Order } from '../../order/entity/order.entity';

@Entity('user')
export class UserEntity extends Base {
  @ApiProperty({
    description: 'ID único del usuario',
    example: 1,
    type: Number
  })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: bigint;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@ejemplo.com',
    type: String
  })
  @Column({
    type: 'varchar',
    unique: true,
    nullable: false
  })
  email: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan',
    type: String
  })
  @Column({
    type: 'varchar',
    nullable: false
  })
  name: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Pérez',
    type: String
  })
  @Column({
    name: 'last_name',
    type: 'varchar',
    nullable: false
  })
  lastName: string;

  @ApiProperty({
    description: 'Contraseña del usuario (hash)',
    type: String
  })
  @Column({
    type: 'varchar',
    nullable: false,
    select: false
  })
  password: string;

  @ApiProperty({
    description: 'Número telefónico del usuario',
    example: '5512345678',
    type: String
  })
  @Column({
    name: 'phone_number',
    type: 'varchar',
    nullable: true
  })
  phoneNumber: string;

  @ApiProperty({
    description: 'Rol del usuario en el sistema',
    example: 'USER',
    enum: [
      stringConstants.ADMIN,
      stringConstants.MANAGER,
      stringConstants.FREQUENT_CUSTOMER,
      stringConstants.GENERAL_CUSTOMER
    ]
  })
  @Column({
    type: 'enum',
    enum: [
      stringConstants.ADMIN,
      stringConstants.MANAGER,
      stringConstants.FREQUENT_CUSTOMER,
      stringConstants.GENERAL_CUSTOMER
    ],
    default: stringConstants.GENERAL_CUSTOMER
  })
  role: string;

  @ApiProperty({
    description: 'Estado del usuario',
    example: 'ACTIVE',
    enum: [stringConstants.STATUS_ACTIVE, stringConstants.STATUS_INACTIVE]
  })
  @Column({
    type: 'enum',
    enum: [stringConstants.STATUS_ACTIVE, stringConstants.STATUS_INACTIVE],
    default: stringConstants.STATUS_ACTIVE
  })
  status: string;

  @ApiProperty({
    description: 'Código de verificación/reseteo',
    example: 'ABC123',
    type: String,
    required: false
  })
  @Column({
    type: 'varchar',
    nullable: true
  })
  code: string;

  @ApiProperty({
    description: 'Fecha de generación del código',
    example: '2024-03-20T14:00:00.000Z',
    type: Date,
    required: false
  })
  @Column({
    name: 'code_generated_at',
    type: 'timestamp',
    nullable: true
  })
  codeCreatedAt: Date;

  // Relaciones
  @OneToMany(() => BillingInfo, billingInfo => billingInfo.user)
  billingInfos: BillingInfo[];

  @OneToMany(() => ShippingAddress, shippingAddress => shippingAddress.user)
  shippingAddresses: ShippingAddress[];

  @OneToMany(() => Order, order => order.user)
  orders: Order[];
}
