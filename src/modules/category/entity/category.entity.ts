import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Base } from '../../base/entity/base.entity';
import { stringConstants } from '../../../utils/string.constant';
import { Product } from '../../product/entity/product.entity';
import { BrandCategory } from '../../brand-category/entity/brand-category.entity';

@Entity('category')
export class Category extends Base {
  @ApiProperty({
    description: 'ID único de la categoría',
    example: 1,
    type: Number
  })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: bigint;

  @ApiProperty({
    description: 'Nombre de la categoría',
    example: 'Electrónicos',
    type: String
  })
  @Column({ type: 'varchar' })
  name: string;

  @ApiProperty({
    description: 'Descripción de la categoría',
    example: 'Productos electrónicos de alta calidad',
    type: String,
    required: false
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    description: 'URL de la imagen de la categoría',
    example: 'https://example.com/category-image.jpg',
    type: String,
    required: false
  })
  @Column({ type: 'varchar', nullable: true })
  url: string;

  @ApiProperty({
    description: 'Estado de la categoría',
    example: 'ACTIVE',
    enum: [stringConstants.STATUS_ACTIVE, stringConstants.STATUS_INACTIVE]
  })
  @Column({
    type: 'enum',
    enum: [stringConstants.STATUS_ACTIVE, stringConstants.STATUS_INACTIVE],
    default: stringConstants.STATUS_ACTIVE
  })
  status: string;

  @OneToMany(() => Product, product => product.category)
  products: Product[];

  @OneToMany(() => BrandCategory, brandCategory => brandCategory.category)
  brandCategories: BrandCategory[];
}
