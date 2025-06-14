import { Module } from '@nestjs/common';
import { ShareProductService } from './share-product.service';
import { ShareProductController } from './share-product.controller';
import { ProductModule } from '../product/product.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ProductModule,
    ConfigModule
  ],
  controllers: [ShareProductController],
  providers: [ShareProductService],
  exports: [ShareProductService]
})
export class ShareProductModule {} 