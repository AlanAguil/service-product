import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Base } from '../../base/entity/base.entity';
import { stringConstants } from '../../../utils/string.constant';
import { Brand } from '../../brand/entity/brand.entity';
import { Category } from '../../category/entity/category.entity';
import { OrderDetail } from '../../order-details/entity/order-details.entity';
import { ProductSparePart } from '../../product-spare-part/entity/product-spare-part.entity';
import { JsonArrayTransformer } from '../transformers/json-array.transformer';
import { KeyValueTransformer } from '../transformers/key-value.transformer';
import { KeyValuePair } from '../transformers/interfaces';

@Entity('product')
export class Product extends Base {
  @ApiProperty({
    description: 'ID único del producto',
    example: 1,
    type: Number
  })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: bigint;

  @ApiProperty({
    description: 'ID de la marca relacionada',
    example: 1,
    type: Number
  })
  @Column({ name: 'brand_id', type: 'bigint' })
  brandId: bigint;

  @ApiProperty({
    description: 'ID de la categoría relacionada',
    example: 1,
    type: Number
  })
  @Column({ name: 'category_id', type: 'bigint' })
  categoryId: bigint;

  @ApiProperty({
    description: 'ID externo del producto',
    example: 'PROD-12345',
    type: String,
    required: false
  })
  @Column({ name: 'external_id', type: 'varchar', nullable: true })
  externalId: string;

  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Smartphone Galaxy S21',
    type: String
  })
  @Column({ type: 'varchar' })
  name: string;

  @ApiProperty({
    description: 'Descripción corta del producto',
    example: 'Smartphone de última generación',
    type: String
  })
  @Column({ name: 'short_description', type: 'varchar' })
  shortDescription: string;

  @ApiProperty({
    description: 'Descripción detallada del producto',
    example: 'El Galaxy S21 cuenta con una pantalla de 6.2 pulgadas...',
    type: String,
    required: false
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    description: 'Funcionalidades del producto',
    example: ['Reconocimiento facial', 'Resistente al agua', 'Carga inalámbrica'],
    type: [String],
    required: false
  })
  @Column({ 
    type: 'text', 
    nullable: true, 
    comment: 'JSON array',
    transformer: new JsonArrayTransformer()
  })
  functionalities: string[];

  @ApiProperty({
    description: 'Datos técnicos del producto',
    example: [
      { key: 'Potencia', value: '550w' },
      { key: 'Voltaje', value: '128v' }
    ],
    type: [Object],
    required: false
  })
  @Column({ 
    name: 'technical_data', 
    type: 'text', 
    nullable: true, 
    comment: 'JSON array of key-value pairs',
    transformer: new KeyValueTransformer()
  })
  technicalData: KeyValuePair[];

  @ApiProperty({
    description: 'Tipo de producto',
    example: 'Smartphone',
    type: String
  })
  @Column({ type: 'varchar' })
  type: string;

  @ApiProperty({
    description: 'Uso recomendado del producto',
    example: 'Personal/Empresarial',
    type: String,
    required: false
  })
  @Column({ name: 'product_usage', type: 'varchar', nullable: true })
  productUsage: string;

  @ApiProperty({
    description: 'Precio de venta',
    example: 14999.99,
    type: Number
  })
  @Column({ type: 'double precision' })
  price: number;

  @ApiProperty({
    description: 'Costo del producto',
    example: 10000.0,
    type: Number
  })
  @Column({ type: 'double precision' })
  cost: number;

  @ApiProperty({
    description: 'Descuento aplicado al producto',
    example: 1500.0,
    type: Number,
    required: false
  })
  @Column({ type: 'double precision', default: 0 })
  discount: number;

  @ApiProperty({
    description: 'Cantidad en inventario',
    example: 50,
    type: Number
  })
  @Column({ type: 'int' })
  stock: number;

  @ApiProperty({
    description: 'Período de garantía en meses',
    example: 12,
    type: Number,
    required: false
  })
  @Column({ type: 'int', nullable: true })
  garanty: number;

  @ApiProperty({
    description: 'Color del producto',
    example: 'Negro',
    type: String,
    required: false
  })
  @Column({ type: 'varchar', nullable: true })
  color: string;

  @ApiProperty({
    description: 'Enlaces de descarga (manuales, drivers, etc.)',
    example: [
      { key: 'Manual de usuario', value: 'https://example.com/manuales/s21.pdf' },
      { key: 'Drivers', value: 'https://example.com/drivers/s21.zip' }
    ],
    type: [Object],
    required: false
  })
  @Column({ 
    type: 'text', 
    nullable: true, 
    comment: 'JSON array of key-value pairs',
    transformer: new KeyValueTransformer()
  })
  downloads: KeyValuePair[];

  @ApiProperty({
    description: 'Indica si el producto está disponible para renta',
    example: true,
    type: Boolean
  })
  @Column({ type: 'boolean', default: false })
  rentable: boolean;

  @ApiProperty({
    description: 'Estado del producto',
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
  @ManyToOne(() => Brand, brand => brand.products)
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @ManyToOne(() => Category, category => category.products)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => OrderDetail, orderDetail => orderDetail.product)
  orderDetails: OrderDetail[];

  @OneToMany(() => ProductSparePart, productSparePart => productSparePart.product)
  productSpareParts: ProductSparePart[];
}
