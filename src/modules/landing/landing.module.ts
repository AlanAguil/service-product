import { Module } from '@nestjs/common';
import { LandingController } from './landing.controller';
import { LandingService } from './landing.service';
import { Landing } from './entity/landing.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [TypeOrmModule.forFeature([Landing])],
    controllers: [LandingController],
    providers: [LandingService],
    exports: [LandingService, TypeOrmModule],
})
export class LandingModule {}



