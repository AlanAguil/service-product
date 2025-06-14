import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingInfoController } from './billing-info.controller';
import { BillingInfoService } from './billing-info.service';
import { BillingInfo } from './entity/billing-info.entity';

@Module({
    imports: [TypeOrmModule.forFeature([BillingInfo])],
    controllers: [BillingInfoController],
    providers: [BillingInfoService],
    exports: [BillingInfoService, TypeOrmModule],
})
export class BillingInfoModule {}