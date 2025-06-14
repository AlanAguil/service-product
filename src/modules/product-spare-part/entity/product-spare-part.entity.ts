import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Base } from '../../base/entity/base.entity';
import { Product } from '../../product/entity/product.entity';
import { SparePart } from '../../spare-part/entity/spare-part.entity';

@Entity('product_spare_part')
export class ProductSparePart extends Base {
  @ApiProperty({
    description: 'ID único de la relación producto-repuesto',
    example: 1,
    type: Number
  })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: bigint;

  @ApiProperty({
    description: 'ID del producto',
    example: 1,
    type: Number
  })
  @Column({ name: 'product_id', type: 'bigint' })
  productId: bigint;

  @ApiProperty({
    description: 'ID del repuesto',
    example: 1,
    type: Number
  })
  @Column({ name: 'spare_part_id', type: 'bigint' })
  sparePartId: bigint;

  @ApiProperty({
    description: 'Notas de compatibilidad',
    example: 'Compatible con modelos de 2021 a 2023',
    type: String,
    required: false
  })
  @Column({ name: 'compatibility_notes', type: 'text', nullable: true })
  compatibilityNotes: string;

  // Relaciones
  @ManyToOne(() => Product, product => product.productSpareParts)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => SparePart, sparePart => sparePart.productSpareParts)
  @JoinColumn({ name: 'spare_part_id' })
  sparePart: SparePart;
}
