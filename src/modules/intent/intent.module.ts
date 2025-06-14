import { Module, forwardRef } from '@nestjs/common';
import { IntentService } from './intent.service';
import { IaModule } from '../ia/ia.module';
import { ReportModule } from '../report/report.module';
import { CustomLoggerService } from '../../common/logger/logger.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    IaModule,
    forwardRef(() => ReportModule),
    forwardRef(() => WhatsappModule),
  ],
  providers: [IntentService, CustomLoggerService],
  exports: [IntentService],
})
export class IntentModule {} 