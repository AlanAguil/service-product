import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order } from './entity/order.entity';
import { OrderHistory } from './entity/order-history.entity';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { ReportModule } from '../report/report.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Order, OrderHistory]),
        forwardRef(() => WhatsappModule),
        ReportModule
    ],
    controllers: [OrderController],
    providers: [OrderService],
    exports: [OrderService, TypeOrmModule],
})
export class OrderModule {}