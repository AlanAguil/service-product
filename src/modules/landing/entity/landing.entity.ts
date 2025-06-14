import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Base } from '../../base/entity/base.entity';
import { stringConstants } from '../../../utils/string.constant';

@Entity('landing')
export class Landing extends Base {
  @ApiProperty({
    description: 'ID único del landing',
    example: 1,
    type: Number
  })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: bigint;

  @ApiProperty({
    description: 'Título del landing',
    example: 'Promoción de verano',
    type: String
  })
  @Column({ type: 'varchar' })
  title: string;

  @ApiProperty({
    description: 'Descripción del landing',
    example: 'Aprovecha nuestras mejores ofertas de la temporada...',
    type: String,
    required: false
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    description: 'Tipo de landing',
    example: 'PROMOTION',
    enum: ['PROMOTION', 'EVENT', 'NEWS', 'PRODUCT_LAUNCH']
  })
  @Column({
    type: 'enum',
    enum: ['PROMOTION', 'EVENT', 'NEWS', 'PRODUCT_LAUNCH'],
    default: 'PROMOTION'
  })
  type: string;

  @ApiProperty({
    description: 'Estado del landing',
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
    description: 'URL de la imagen del landing',
    example: 'https://example.com/landing-image.jpg',
    type: String,
    required: false
  })
  @Column({ type: 'varchar', nullable: true })
  url: string;
}
