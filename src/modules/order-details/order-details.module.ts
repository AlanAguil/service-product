import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderDetailsController } from './order-details.controller';
import { OrderDetailService } from './order-details.service';
import { OrderDetail } from './entity/order-details.entity';

@Module({
    imports: [TypeOrmModule.forFeature([OrderDetail])],
    controllers: [OrderDetailsController],
    providers: [OrderDetailService],
    exports: [OrderDetailService, TypeOrmModule],
})
export class OrderDetailsModule {}


