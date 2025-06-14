import { Column, DeleteDateColumn } from "typeorm";
import { ApiProperty } from '@nestjs/swagger';

export abstract class Base {
  @ApiProperty({
    description: 'usuario que creó el registro',
    example: '1',
    type: String,
    required: false
  })
  @Column("varchar", {
    name: "created_by",
    nullable: true,
    comment: "usuario que creó el registro",
  })
  createdBy: string | null;

  @ApiProperty({
    description: 'usuario que actualizó el registro',
    example: '1',
    type: String,
    required: false
  })
  @Column("varchar", {
    name: "updated_by",
    nullable: true,
    comment: "usuario que actualizó el registro",
  })
  updatedBy: string | null;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2024-03-20T14:00:00.000Z',
    type: Date,
    required: false
  })
  @Column("timestamp", {
    name: "created_at",
    nullable: true,
    comment: "Fecha de creación",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date | null;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2024-03-20T14:00:00.000Z',
    type: Date,
    required: false
  })
  @Column("timestamp", {
    name: "updated_at",
    nullable: true,
    comment: "Fecha de última actualización",
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt: Date | null;

  @DeleteDateColumn({
    name: "deleted_at",
    type: "timestamp",
    nullable: true,
    comment: "Logical deletion date",
  })
  @ApiProperty({ example: null })
  deletedAt: Date | null;
}
