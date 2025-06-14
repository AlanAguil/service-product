import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Base } from '../../base/entity/base.entity';
import { stringConstants } from '../../../utils/string.constant';
import { Product } from '../../product/entity/product.entity';
import { BrandCategory } from '../../brand-category/entity/brand-category.entity';

@Entity('brand')
export class Brand extends Base {
  @ApiProperty({
    description: 'ID único de la marca',
    example: 1,
    type: Number
  })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: bigint;

  @ApiProperty({
    description: 'Nombre de la marca',
    example: 'Samsung',
    type: String
  })
  @Column({ type: 'varchar' })
  name: string;

  @ApiProperty({
    description: 'Descripción de la marca',
    example: 'Compañía líder en electrónicos',
    type: String,
    required: false
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    description: 'Color representativo de la marca en formato hexadecimal',
    example: '#1428A0',
    type: String,
    required: false
  })
  @Column({ type: 'varchar', nullable: true })
  color: string;
  
  @ApiProperty({
    description: 'URL de la imagen de la marca',
    example: 'https://example.com/brand-image.jpg',
    type: String,
    required: false
  })
  @Column({ type: 'varchar', nullable: true })
  url: string;

  @ApiProperty({
    description: 'Estado de la marca',
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
  @OneToMany(() => Product, product => product.brand)
  products: Product[];

  @OneToMany(() => BrandCategory, brandCategory => brandCategory.brand)
  brandCategories: BrandCategory[];
}
