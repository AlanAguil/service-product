import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { CustomLoggerService } from 'src/common/logger/logger.service';
import { DataSource, Not, Repository } from 'typeorm';
import { HandleException } from '../../common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from '../../common/exceptions/types/notFound.exception';
import { comparePasswords, hashPassword } from '../../utils/password.utils';
import { stringConstants } from '../../utils/string.constant';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { UserEntity } from './entity/user.entity';
import { CreateUserDto } from './model/create.user.dto';
import { ResetPasswordCodeDTO } from './model/reset.password.code.dto';
import { ResetPasswordDTO } from './model/reset.password.dto';
import { UpdateProfileDto } from './model/update-profile.dto';
import { UpdateUserDto } from './model/update.user.dto';
import { VerifyCodeDTO } from './model/verify.code.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly logger: CustomLoggerService,
    private readonly whatsappService: WhatsappService,
  ) { }

  async findAll() {
    try {
      return await this.userRepository.find();
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async findById(id: bigint) {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }
      return user;
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async findByEmail(email: string) {
    try {
      return await this.userRepository.findOne({
        where: { email },
        select: ['id', 'email', 'name', 'lastName', 'password', 'phoneNumber', 'role', 'status']
      });
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async findByPhoneNumber(phoneNumber: string) {
    try {
      return await this.userRepository.findOne({
        where: { phoneNumber },
        select: ['id', 'email', 'name', 'lastName', 'phoneNumber', 'role', 'status', 'createdAt']
      });
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async create(createUserDTO: CreateUserDto) {
    try {
      await this.validateUniqueFields(
        createUserDTO.email,
        createUserDTO.phoneNumber,
      );

      const hashedPassword = await hashPassword(createUserDTO.password);
      const user = this.userRepository.create({
        ...createUserDTO,
        password: hashedPassword,
      });

      const savedUser = await this.userRepository.save(user);

      // // Enviar mensaje de bienvenida
      // try {
      //   await this.whatsappService.sendMessage(
      //     createUserDTO.phoneNumber,
      //     stringConstants.whatsappTemplates.welcome.message,
      //     createUserDTO.name
      //   );
      // } catch (whatsappError) {
      //   this.logger.logException('UserService', 'create', whatsappError);
      // }

      return savedUser;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        error.message || 'Error al crear el usuario',
      );
    }
  }

  async update(updateUserDTO: UpdateUserDto) {
    try {
      const user = await this.findById(updateUserDTO.id);
      if (!user) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }

      await this.validateUniqueFields(
        updateUserDTO.email,
        updateUserDTO.phoneNumber,
        updateUserDTO.id,
      );

      const { id, ...updateData } = updateUserDTO;
      await this.userRepository.update({ id }, updateData);
      return await this.findById(id);
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async register(createUserDTO: CreateUserDto) {
    try {
      await this.validateUniqueFields(
        createUserDTO.email,
        createUserDTO.phoneNumber,
      );

      const hashedPassword = await hashPassword(createUserDTO.password);
      const user = this.userRepository.create({
        ...createUserDTO,
        password: hashedPassword,
        role: 'CLIENT',
        status: 'ACTIVE',
      });

      const savedUser = await this.userRepository.save(user);

      // try {
      //   await this.whatsappService.sendMessage(
      //     createUserDTO.phoneNumber,
      //     stringConstants.whatsappTemplates.welcome.message,
      //     createUserDTO.name
      //   );
      // } catch (whatsappError) {
      //   this.logger.logException('UserService', 'register', whatsappError);
      // }

      return savedUser;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        error.message || 'Error al registrar el usuario',
      );
    }
  }

  private async validateUniqueFields(
    email?: string,
    phoneNumber?: string,
    excludeUserId?: bigint,
  ) {
    this.logger.logRequest('validateUniqueFields', { email, phoneNumber, excludeUserId });

    // Validar email único
    if (email) {
      this.logger.logRequest('validateUniqueFields', `Validando email: ${email}`);
      const emailExists = await this.userRepository.exists({
        where: {
          email,
          id: excludeUserId ? Not(excludeUserId) : undefined
        }
      });

      if (emailExists) {
        this.logger.logException('UserService', 'validateUniqueFields', new Error(`Email duplicado: ${email}`));
        throw new BadRequestException('Ya existe un usuario con este email');
      }
    }

    if (phoneNumber) {
      this.logger.logRequest('validateUniqueFields', `Validando teléfono: ${phoneNumber}`);
      const phoneExists = await this.userRepository.exists({
        where: {
          phoneNumber,
          id: excludeUserId ? Not(excludeUserId) : undefined
        }
      });

      if (phoneExists) {
        this.logger.logException('UserService', 'validateUniqueFields', new Error(`Teléfono duplicado: ${phoneNumber}`));
        throw new BadRequestException(
          'Ya existe un usuario con este número de teléfono',
        );
      }
    }

    this.logger.logRequest('validateUniqueFields', 'Validación de campos únicos completada');
  }

  async resetPassword(resetPasswordDTO: ResetPasswordDTO) {
    try {
      const user = await this.findById(resetPasswordDTO.id);
      if (!user) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }

      const hashedPassword = await hashPassword(resetPasswordDTO.password);
      await this.userRepository.update(
        { id: resetPasswordDTO.id },
        { password: hashedPassword },
      );

      return await this.findById(resetPasswordDTO.id);
    } catch (error) {
      if (error instanceof NotFoundCustomException) {
        throw error;
      }
      throw new BadRequestException(
        error.message || 'Error al resetear la contraseña',
      );
    }
  }

  async sendCodeEmail(id: bigint) {
    try {
      const user = await this.findById(id);
      if (!user) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }

      // Generar código de 6 dígitos
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedCode = await hashPassword(code);

      // Guardar código hasheado y fecha de creación
      await this.userRepository.update(
        { id },
        {
          code: hashedCode,
          codeCreatedAt: new Date(),
        },
      );

      return { code }; // En producción, este código se enviaría por email
    } catch (error) {
      if (error instanceof NotFoundCustomException) {
        throw error;
      }
      throw new BadRequestException(
        error.message || 'Error al generar el código',
      );
    }
  }

  async resetPasswordWithCode(resetPasswordCodeDTO: ResetPasswordCodeDTO) {
    try {
      const user = await this.findById(resetPasswordCodeDTO.id);
      if (!user) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }

      if (!user.code || !user.codeCreatedAt) {
        throw new BadRequestException('No hay código de verificación generado');
      }

      // Verificar si el código ha expirado (15 minutos)
      const codeAge = new Date().getTime() - user.codeCreatedAt.getTime();
      if (codeAge > 15 * 60 * 1000) {
        throw new BadRequestException('El código ha expirado');
      }

      // Verificar el código
      const isValidCode = await comparePasswords(
        resetPasswordCodeDTO.code,
        user.code,
      );
      if (!isValidCode) {
        throw new BadRequestException('Código de verificación inválido');
      }

      // Actualizar contraseña
      const hashedPassword = await hashPassword(resetPasswordCodeDTO.password);
      await this.userRepository.update(
        { id: resetPasswordCodeDTO.id },
        {
          password: hashedPassword,
          code: undefined,
          codeCreatedAt: undefined,
        },
      );

      return await this.findById(resetPasswordCodeDTO.id);
    } catch (error) {
      if (
        error instanceof NotFoundCustomException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        error.message || 'Error al resetear la contraseña con código',
      );
    }
  }

  async findAllActive() {
    try {
      return await this.userRepository.find({
        where: { status: stringConstants.STATUS_ACTIVE }
      });
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async sendVerificationCode(userId: bigint) {
    try {
      const user = await this.findById(userId);
      if (!user) throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedCode = await bcrypt.hash(code, 10);
      await this.userRepository.update(
        { id: userId },
        { code: hashedCode, codeCreatedAt: new Date() }
      );
      // Enviar WhatsApp
      const url = process.env.URL_WEB || 'ucore.cloud/verificationCode';
      const message = `Tu código de verificación es: ${code}\nIngresa a: ${url}`;
      try {
        await this.whatsappService.sendMessage(user.phoneNumber, message, user.name);
      } catch (err) {
        this.logger.logException('UserService', 'sendVerificationCode', err);
        throw new BadRequestException('Error al enviar el código por WhatsApp');
      }
      return { success: true, message: 'Código enviado por WhatsApp' };
    } catch (error) {
      throw new BadRequestException(error.message || 'Error al generar o enviar el código');
    }
  }

  async verifyCodeAndSetPassword(verifyCodeDTO: VerifyCodeDTO) {
    try {
      const user = await this.findById(verifyCodeDTO.id);
      if (!user) throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      if (!user.code || !user.codeCreatedAt) throw new BadRequestException('No hay código de verificación generado');
      // Verificar código (15 minutos de validez)
      const codeAge = new Date().getTime() - user.codeCreatedAt.getTime();
      if (codeAge > 15 * 60 * 1000) throw new BadRequestException('El código ha expirado');
      const isValidCode = await bcrypt.compare(verifyCodeDTO.code, user.code);
      if (!isValidCode) throw new BadRequestException('Código de verificación inválido');
      // Hashear nueva contraseña
      const hashedPassword = await hashPassword(verifyCodeDTO.password);
      await this.userRepository.update(
        { id: verifyCodeDTO.id },
        { password: hashedPassword, code: undefined, codeCreatedAt: undefined }
      );
      return { success: true, message: 'Contraseña actualizada correctamente' };
    } catch (error) {
      throw new BadRequestException(error.message || 'Error al verificar el código o actualizar la contraseña');
    }
  }

  async delete(id: bigint) {
    try {
      const user = await this.userRepository.findOneBy({ id: id });
      if (!user) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }
      return await this.userRepository.softDelete(id.toString());
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  async updateProfile(id: bigint, updateProfileDto: UpdateProfileDto) {
    try {
      const user = await this.findById(id);
      if (!user) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }

      await this.validateUniqueFields(
        updateProfileDto.email,
        undefined,
        id,
      );

      Object.assign(user, updateProfileDto);
      await this.userRepository.update({ id }, user);
      return await this.findById(id);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        error.message || 'Error al actualizar el perfil del usuario',
      );
    }
  }

  async getCustomerStats() {
    try {
      const [totalClients, totalUsers] = await Promise.all([
        this.userRepository.count({
          where: { role: 'CLIENT' }
        }),
        this.userRepository.count({
          where: { role: 'USER' }
        })
      ]);

      return {
        totalClients,
        totalUsers,
        totalAccounts: totalClients + totalUsers
      };
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async getUserInfo(phoneNumber: string): Promise<any> {
    try {
      const query = `
        SELECT id, name, last_name, email, phone_number, role, status 
        FROM user 
        WHERE phone_number = ? AND deleted_at IS NULL 
        LIMIT 1
      `;

      this.logger.logWhatsapp(`Ejecutando consulta de usuario: ${query}`);
      const users = await this.dataSource.query(query, [phoneNumber]);

      if (users && users.length > 0) {
        const user = users[0];
        this.logger.logWhatsapp(`Usuario encontrado: ${user.name} ${user.last_name} - Rol: ${user.role}`);
        return {
          id: user.id,
          name: user.name,
          lastName: user.last_name,
          email: user.email,
          role: user.role,
          status: user.status,
          isRegistered: true,
          phoneNumber: phoneNumber
        };
      }

      throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
    } catch (error) {
      HandleException.exception(error);
    }
  }
}
