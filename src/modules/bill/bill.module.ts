import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillController } from './bill.controller';
import { BillService } from './bill.service';
import { Bill } from './entity/bill.entity';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Bill]),
        forwardRef(() => WhatsappModule)
    ],
    controllers: [BillController],
    providers: [BillService],
    exports: [BillService, TypeOrmModule],
})
export class BillModule {}