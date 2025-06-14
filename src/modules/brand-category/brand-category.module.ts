import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandCategoryService } from './brand-category.service';
import { BrandCategory } from './entity/brand-category.entity';
import { BrandCategoryController } from './brand-category.controller';

@Module({
    imports: [TypeOrmModule.forFeature([BrandCategory])],
    controllers: [BrandCategoryController],
    providers: [BrandCategoryService],
    exports: [BrandCategoryService, TypeOrmModule],
})
export class BrandCategoryModule {}
