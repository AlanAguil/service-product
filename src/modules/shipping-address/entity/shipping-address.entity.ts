import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Base } from '../../base/entity/base.entity';
import { stringConstants } from '../../../utils/string.constant';
import { UserEntity } from '../../user/entity/user.entity';

@Entity('shipping_address')
export class ShippingAddress extends Base {
  @ApiProperty({
    description: 'ID único de la dirección de envío',
    example: 1,
    type: Number
  })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: bigint;

  @ApiProperty({
    description: 'ID del usuario relacionado',
    example: 1,
    type: Number
  })
  @Column({ name: 'user_id', type: 'bigint' })
  userId: bigint;

  @ApiProperty({
    description: 'Nombre del receptor',
    example: 'Juan Pérez',
    type: String
  })
  @Column({ type: 'varchar' })
  receiver: string;

  @ApiProperty({
    description: 'Calle',
    example: 'Av. Siempre Viva',
    type: String
  })
  @Column({ type: 'varchar' })
  street: string;

  @ApiProperty({
    description: 'Número exterior',
    example: '123',
    type: String
  })
  @Column({ name: 'exterior_number', type: 'varchar' })
  exteriorNumber: string;

  @ApiProperty({
    description: 'Número interior',
    example: 'B',
    type: String,
    required: false
  })
  @Column({ name: 'interior_number', type: 'varchar', nullable: true })
  interiorNumber: string;

  @ApiProperty({
    description: 'Colonia',
    example: 'Centro',
    type: String
  })
  @Column({ type: 'varchar' })
  neighborhood: string;

  @ApiProperty({
    description: 'Ciudad',
    example: 'Ciudad de México',
    type: String
  })
  @Column({ type: 'varchar' })
  city: string;

  @ApiProperty({
    description: 'Estado',
    example: 'CDMX',
    type: String
  })
  @Column({ type: 'varchar' })
  state: string;

  @ApiProperty({
    description: 'Código postal',
    example: '01000',
    type: String
  })
  @Column({ name: 'postal_code', type: 'varchar' })
  postalCode: string;

  @ApiProperty({
    description: 'Número de teléfono para contacto',
    example: '5512345678',
    type: String
  })
  @Column({ name: 'phone_number', type: 'varchar' })
  phoneNumber: string;

  @ApiProperty({
    description: 'Referencias para ubicar el domicilio',
    example: 'Casa azul con rejas blancas',
    type: String,
    required: false
  })
  @Column({ name: 'references_text', type: 'varchar', nullable: true })
  referencesText: string;

  @ApiProperty({
    description: 'Indica si es la dirección seleccionada por defecto',
    example: true,
    type: Boolean
  })
  @Column({ name: 'is_selected', type: 'boolean', default: false })
  isSelected: boolean;

  @ApiProperty({
    description: 'Estado de la dirección de envío',
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
  @ManyToOne(() => UserEntity, user => user.shippingAddresses)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
