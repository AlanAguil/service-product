import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaEntity } from './entity/media.entity';
import { CloudflareModule } from '../cloudflare/cloudflare.module';
import { CustomLoggerService } from '../../common/logger/logger.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MediaEntity]),
    CloudflareModule
  ],
  controllers: [MediaController],
  providers: [MediaService, CustomLoggerService],
  exports: [MediaService]
})
export class MediaModule {}
