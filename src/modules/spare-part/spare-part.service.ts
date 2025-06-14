import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SparePart } from './entity/spare-part.entity';
import { CreateSparePartDto } from './model/create.spare-part.dto';
import { UpdateSparePartDto } from './model/update.spare-part.dto';
import { MediaService } from '../media/media.service';
import { stringConstants } from '../../utils/string.constant';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from '../../common/exceptions/types/notFound.exception';
import { HandleException } from '../../common/exceptions/handler/handle.exception';

@Injectable()
export class SparePartService {

  constructor(
    @InjectRepository(SparePart)
    private sparePartRepository: Repository<SparePart>,
    private mediaService: MediaService,
  ) {}

  async findAll(){
    try {
      const spareParts = await this.sparePartRepository.find();
      const sparePartsWithMedia = await Promise.all(
        spareParts.map(async (sparePart) => {
          const media = await this.mediaService.findByEntityId(
            sparePart.id,
            stringConstants.ENTITY_TYPE_SPARE_PART
          );
          return {
            ...sparePart,
            media
          };
        })
      );
      return sparePartsWithMedia;
    } catch (error) {
      HandleException.exception(error);
      throw error;
    }
  }

  async findAllActive(){
    try {
      const spareParts = await this.sparePartRepository.find({
        where: { status: stringConstants.STATUS_ACTIVE }
      });
      const sparePartsWithMedia = await Promise.all(
        spareParts.map(async (sparePart) => {
          const media = await this.mediaService.findByEntityId(
            sparePart.id,
            stringConstants.ENTITY_TYPE_SPARE_PART
          );
          return {
            ...sparePart,
            media
          };
        })
      );
      return sparePartsWithMedia;
    } catch (error) {
      HandleException.exception(error);
      throw error;
    }
  }

  async findById(id: bigint){
    try {
      const sparePart = await this.sparePartRepository.findOne({
        where: { id }
      });
      if (!sparePart) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.SPARE_PART);
      }
      const media = await this.mediaService.findByEntityId(
        id,
        stringConstants.ENTITY_TYPE_SPARE_PART
      );
      return {
        ...sparePart,
        media
      };
    } catch (error) {
      HandleException.exception(error);
      throw error;
    }
  }

  async create(createSparePartDto: CreateSparePartDto) {
    try {
      const { media, ...sparePartData } = createSparePartDto;
      
      const sparePart = this.sparePartRepository.create(sparePartData);
      const savedSparePart = await this.sparePartRepository.save(sparePart);
      
      if (media && media.length > 0) {
        await this.mediaService.update(media, savedSparePart.id, stringConstants.ENTITY_TYPE_SPARE_PART);
      }
      
      return this.findById(savedSparePart.id);
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async update(updateSparePartDto: UpdateSparePartDto) {
    try {
      const { media, ...sparePartData } = updateSparePartDto;
      
      const sparePart = await this.sparePartRepository.findOne({
        where: { id: updateSparePartDto.id }
      });
      
      if (!sparePart) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.SPARE_PART);
      }
      
      Object.assign(sparePart, sparePartData);
      await this.sparePartRepository.update({ id: sparePart.id }, sparePart);
      
      if (media) {
        await this.mediaService.update(media, sparePart.id, stringConstants.ENTITY_TYPE_SPARE_PART);
      }
      
      return this.findById(sparePart.id);
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async delete(id: bigint) {
    try {
      const sparePart = await this.sparePartRepository.findOneBy({ id: id });
      if (!sparePart) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.SPARE_PART);
      }
      return await this.sparePartRepository.softDelete(id.toString());
    } catch (exception) {
      HandleException.exception(exception);
    }
  }
}
