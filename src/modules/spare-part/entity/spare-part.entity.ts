import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Base } from '../../base/entity/base.entity';
import { stringConstants } from '../../../utils/string.constant';
import { ProductSparePart } from '../../product-spare-part/entity/product-spare-part.entity';

@Entity('spare_part')
export class SparePart extends Base {
  @ApiProperty({
    description: 'ID único del repuesto',
    example: 1,
    type: Number
  })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: bigint;

  @ApiProperty({
    description: 'ID externo del repuesto',
    example: 'SP-12345',
    type: String,
    required: false
  })
  @Column({ name: 'external_id', type: 'varchar', nullable: true })
  externalId: string;

  @ApiProperty({
    description: 'Código del repuesto',
    example: 'RP-ABC-123',
    type: String
  })
  @Column({ type: 'varchar' })
  code: string;

  @ApiProperty({
    description: 'Nombre del repuesto',
    example: 'Pantalla OLED Galaxy S21',
    type: String
  })
  @Column({ type: 'varchar' })
  name: string;

  @ApiProperty({
    description: 'Descripción detallada del repuesto',
    example: 'Pantalla OLED original para Samsung Galaxy S21...',
    type: String,
    required: false
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    description: 'Material del repuesto',
    example: 'Vidrio, plástico y componentes electrónicos',
    type: String,
    required: false
  })
  @Column({ type: 'varchar', nullable: true })
  material: string;

  @ApiProperty({
    description: 'Precio de venta',
    example: 2999.99,
    type: Number
  })
  @Column({ type: 'double precision' })
  price: number;

  @ApiProperty({
    description: 'Cantidad en inventario',
    example: 25,
    type: Number
  })
  @Column({ type: 'int' })
  stock: number;

  @ApiProperty({
    description: 'Indica si el repuesto está disponible para renta',
    example: false,
    type: Boolean
  })
  @Column({ type: 'boolean', default: false })
  rentable: boolean;

  @ApiProperty({
    description: 'Estado del repuesto',
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
  @OneToMany(() => ProductSparePart, productSparePart => productSparePart.sparePart)
  productSpareParts: ProductSparePart[];
}
