import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Base } from '../../base/entity/base.entity';
import { Brand } from '../../brand/entity/brand.entity';
import { Category } from '../../category/entity/category.entity';

@Entity('brand_category')
export class BrandCategory extends Base {
  @ApiProperty({
    description: 'ID único de la relación marca-categoría',
    example: 1,
    type: Number
  })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: bigint;

  @ApiProperty({
    description: 'ID de la marca',
    example: 1,
    type: Number
  })
  @Column({ name: 'brand_id', type: 'bigint' })
  brandId: bigint;

  @ApiProperty({
    description: 'ID de la categoría',
    example: 1,
    type: Number
  })
  @Column({ name: 'category_id', type: 'bigint' })
  categoryId: bigint;

  // Relaciones
  @ManyToOne(() => Brand, brand => brand.brandCategories)
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @ManyToOne(() => Category, category => category.brandCategories)
  @JoinColumn({ name: 'category_id' })
  category: Category;
}
