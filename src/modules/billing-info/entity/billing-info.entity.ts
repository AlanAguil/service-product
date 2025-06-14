import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Base } from '../../base/entity/base.entity';
import { stringConstants } from '../../../utils/string.constant';
import { UserEntity } from '../../user/entity/user.entity';

@Entity('billing_info')
export class BillingInfo extends Base {
  @ApiProperty({
    description: 'ID único de la información de facturación',
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
    description: 'Razón social o nombre del negocio',
    example: 'Empresa S.A. de C.V.',
    type: String
  })
  @Column({ name: 'business_name', type: 'varchar' })
  businessName: string;

  @ApiProperty({
    description: 'RFC',
    example: 'XAXX010101000',
    type: String
  })
  @Column({ type: 'varchar' })
  rfc: string;

  @ApiProperty({
    description: 'Uso de CFDI',
    example: 'G01',
    type: String
  })
  @Column({ name: 'cfdi_use', type: 'varchar' })
  cfdiUse: string;

  @ApiProperty({
    description: 'Régimen fiscal',
    example: '601',
    type: String
  })
  @Column({ name: 'tax_regime', type: 'varchar' })
  taxRegime: string;

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
    description: 'Es la información de facturación por defecto',
    example: true,
    type: Boolean
  })
  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean;

  @ApiProperty({
    description: 'Estado de la información de facturación',
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
  @ManyToOne(() => UserEntity, user => user.billingInfos)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
