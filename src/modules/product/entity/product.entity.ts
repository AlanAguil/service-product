import { Entity, Column } from 'typeorm';
import { Base } from '../../base/entity/base.entity';

@Entity('products')
export class Product extends Base {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int', default: 0 })
  stock: number;
}
