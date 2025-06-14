//module
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShippingAddressController } from './shipping-address.controller';
import { ShippingAddressService } from './shipping-address.service';
import { ShippingAddress } from './entity/shipping-address.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ShippingAddress])],
    controllers: [ShippingAddressController],
    providers: [ShippingAddressService],
    exports: [ShippingAddressService, TypeOrmModule],
})
export class ShippingAddressModule {}

