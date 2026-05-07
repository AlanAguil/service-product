import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CustomLoggerService } from './common/logger/logger.service';
import typeOrmConfig from './config/type.orm.config';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { ProductModule } from './modules/product/product.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    typeOrmConfig,
    ProductModule,
  ],
  controllers: [],
  providers: [
    CustomLoggerService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule { }
