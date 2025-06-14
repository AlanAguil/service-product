import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Landing } from './entity/landing.entity';
import { CreateLandingDto } from './model/create-landing.dto';
import { UpdateLandingDto } from './model/update-landing.dto';
import { stringConstants } from '../../utils/string.constant';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { NotFoundCustomExceptionType, NotFoundCustomException } from 'src/common/exceptions/types/notFound.exception';

@Injectable()
export class LandingService {

  constructor(
    @InjectRepository(Landing)
    private landingRepository: Repository<Landing>,
  ) { }
  // funcion eliminar (id)
  // refactorizar todos los find all 
  async findAll() {
    try {
      return await this.landingRepository.find({
        order: { createdAt: 'ASC' }
      });
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async findAllActive() {
    try {
      return await this.landingRepository.find({
        where: { status: stringConstants.STATUS_ACTIVE },
        order: { createdAt: 'ASC' }
      });
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async findById(id: bigint) {
    try {
      const landing = await this.landingRepository.findOne({
        where: { id }
      });

      if (!landing) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.LANDING);
      }

      return landing;
    } catch (error) {
      HandleException.exception(error);
    }
  }


  async create(createLandingDto: CreateLandingDto) {
    try {
      const landing = this.landingRepository.create(createLandingDto);
      return await this.landingRepository.save(landing);
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async update(updateLandingDto: UpdateLandingDto) {
    try {
      const landing = await this.findById(updateLandingDto.id);

      if (!landing) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.LANDING);
      }

      const { id, ...updateData } = updateLandingDto;
      Object.assign(landing, updateData);

      return await this.landingRepository.save(landing);
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async updateStatus(id: bigint, status: string) {
    try {
      const landing = await this.findById(id);
      if (!landing) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.LANDING);
      }
      landing.status = status;

      return await this.landingRepository.save(landing);
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async delete(id: bigint) {
    try {
      const landing = await this.landingRepository.findOneBy({ id: id });
      if (!landing) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.LANDING);
      }
      return await this.landingRepository.softDelete(id.toString());
    } catch (exception) {
      HandleException.exception(exception);
    }
  }
}
