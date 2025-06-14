import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import typeOrmConfig from './config/type.orm.config';
import { AuthModule } from './modules/auth/auth.module';
import { CustomLoggerService } from './common/logger/logger.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { UserModule } from './modules/user/user.module';
import { ShippingAddressModule } from './modules/shipping-address/shipping-address.module';
import { OrderDetailsModule } from './modules/order-details/order-details.module';
import { ProductSparePartModule } from './modules/product-spare-part/product-spare-part.module';
import { OrderModule } from './modules/order/order.module';
import { ProductModule } from './modules/product/product.module';
import { CategoryModule } from './modules/category/category.module';
import { BrandModule } from './modules/brand/brand.module';
import { LandingModule } from './modules/landing/landing.module';
import { MediaModule } from './modules/media/media.module';
import { BillingInfoModule } from './modules/billing-info/billing-info.module';
import { BillModule } from './modules/bill/bill.module';
import { BrandCategoryModule } from './modules/brand-category/brand-category.module';
import { CloudflareModule } from './modules/cloudflare/cloudflare.module';
import { SparePartModule } from './modules/spare-part/spare-part.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { ReportModule } from './modules/report/report.module';
import { IaModule } from './modules/ia/ia.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    typeOrmConfig,
    AuthModule,
    BillModule,
    BillingInfoModule,
    BrandModule,
    BrandCategoryModule,
    CategoryModule,
    CloudflareModule,
    LandingModule,
    MediaModule,
    OrderModule,
    OrderDetailsModule,
    ProductModule,
    ProductSparePartModule,
    ShippingAddressModule,
    SparePartModule,
    UserModule,
    WhatsappModule,
    ReportModule,
    IaModule
  ],
  controllers: [AppController],
  providers: [AppService, CustomLoggerService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },],
})
export class AppModule {

}
