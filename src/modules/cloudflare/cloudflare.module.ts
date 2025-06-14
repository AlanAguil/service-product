import { Module } from '@nestjs/common';
import { CloudflareService } from './cloudflare.service';
import { CustomLoggerService } from '../../common/logger/logger.service';
import { CloudflareConfigModule } from '../../config/cloudflare.config';
import { CloudflareController } from './cloudflare.controller';

@Module({
  imports: [CloudflareConfigModule.forRootAsync()],
  providers: [CloudflareService, CustomLoggerService],
  exports: [CloudflareService],
  controllers: [CloudflareController],
})
export class CloudflareModule {} 