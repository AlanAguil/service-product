import { Module, forwardRef } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { CustomLoggerService } from '../../common/logger/logger.service';
import { OrderModule } from '../order/order.module';
import { BillModule } from '../bill/bill.module';
import { CloudflareModule } from '../cloudflare/cloudflare.module';
import { ReportModule } from '../report/report.module';
import { IntentModule } from '../intent/intent.module';
import { MessageMiddleware } from './middleware/message.middleware';
import { IaModule } from '../ia/ia.module';

@Module({
  imports: [
    forwardRef(() => OrderModule),
    forwardRef(() => BillModule),
    CloudflareModule,
    forwardRef(() => ReportModule),
    forwardRef(() => IntentModule),
    IaModule,
  ],
  controllers: [WhatsappController],
  providers: [WhatsappService, CustomLoggerService, MessageMiddleware],
  exports: [WhatsappService],
})
export class WhatsappModule {} 