import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandController } from './brand.controller';
import { BrandService } from './brand.service';
import { Brand } from './entity/brand.entity';
import { BrandCategoryModule } from '../brand-category/brand-category.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Brand]),
        BrandCategoryModule,
    ],
    controllers: [BrandController],
    providers: [BrandService],
    exports: [BrandService, TypeOrmModule],
})
export class BrandModule {}



