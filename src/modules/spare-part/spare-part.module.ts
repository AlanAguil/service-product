import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SparePartController } from './spare-part.controller';
import { SparePartService } from './spare-part.service';
import { SparePart } from './entity/spare-part.entity';
import { MediaModule } from '../media/media.module';

@Module({
    imports: [TypeOrmModule.forFeature([SparePart]), MediaModule],
    controllers: [SparePartController],
    providers: [SparePartService],
    exports: [SparePartService, TypeOrmModule],
})
export class SparePartModule {}
