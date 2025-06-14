import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserEntity } from './entity/user.entity';
import { CustomLoggerService } from 'src/common/logger/logger.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
    imports: [TypeOrmModule.forFeature([UserEntity]), WhatsappModule],
    controllers: [UserController],
    providers: [UserService, CustomLoggerService],
    exports: [UserService, TypeOrmModule],
})
export class UserModule {}




