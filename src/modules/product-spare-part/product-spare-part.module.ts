import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductSparePartController } from './product-spare-part.controller';
import { ProductSparePartService } from './product-spare-part.service';
import { ProductSparePart } from './entity/product-spare-part.entity';


@Module({
    imports: [TypeOrmModule.forFeature([ProductSparePart])],
    controllers: [ProductSparePartController],
    providers: [ProductSparePartService],
    exports: [ProductSparePartService, TypeOrmModule],
})
export class ProductSparePartModule {}
