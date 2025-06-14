import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MediaEntity } from './entity/media.entity';
import { UpdateMediaDTO } from './model/update.media.dto';
import { CloudflareService } from '../cloudflare/cloudflare.service';
import { CustomLoggerService } from '../../common/logger/logger.service';
import { stringConstants } from '../../utils/string.constant';
import { HandleException } from '../../common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from '../../common/exceptions/types/notFound.exception';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(MediaEntity)
    private readonly mediaRepository: Repository<MediaEntity>,
    private readonly cloudflareService: CloudflareService,
    private readonly logger: CustomLoggerService,
  ) {}

  async uploadFiles(files: Express.Multer.File[]) {
    try {
      this.logger.logMedia(`Starting upload of ${files.length} media files`);

      const uploadedFiles = await Promise.all(
        files.map((file) => this.cloudflareService.uploadToCloudflare(file)),
      );

      const mediaToSave = uploadedFiles.map((result, index) => {
        const mimeType = files[index].mimetype;
        let fileType = stringConstants.FILE_TYPE_OTHER;

        if (mimeType.startsWith('image/')) {
          fileType = stringConstants.FILE_TYPE_IMAGE;
        } else if (mimeType === 'application/pdf') {
          fileType = stringConstants.FILE_TYPE_PDF;
        } else if (mimeType.startsWith('video/')) {
          fileType = stringConstants.FILE_TYPE_VIDEO;
        }

        return {
          url: result.url,
          fileType,
          displayOrder: index,
        } as Partial<MediaEntity>;
      });

      const savedMedia = await this.mediaRepository.save(mediaToSave);
      this.logger.logMedia(
        `Files uploaded and saved successfully: ${savedMedia.map((m) => m.id).join(', ')}`,
      );
      return savedMedia;
    } catch (error) {
      this.logger.logException('MediaService', 'uploadFiles', error);
      throw new BadRequestException(
        error.message || 'Error uploading media files',
      );
    }
  }

  async deleteFiles(ids: bigint[]) {
    try {
      if (!ids?.length) {
        this.logger.logMedia('Delete attempt without IDs');
        throw new BadRequestException('No IDs provided for deletion');
      }

      this.logger.logMedia(`Starting deletion of ${ids.length} media files`);

      const mediaRecords = await this.mediaRepository.find({
        where: ids.map((id) => ({ id })),
      });

      if (!mediaRecords.length) {
        this.logger.logMedia('No media files found for deletion');
        throw new BadRequestException('No media files found to delete');
      }

      await Promise.all(
        mediaRecords.map((media) =>
          this.cloudflareService.deleteFromCloudflare(media.url),
        ),
      );

      const deleteResult = await this.mediaRepository.delete({ id: In(ids) });
      if (deleteResult.affected !== ids.length) {
        this.logger.logMedia(
          `Warning: Not all records were deleted. Expected: ${ids.length}, Deleted: ${deleteResult.affected}`,
        );
      }

      this.logger.logMedia(
        `Successfully deleted media files: ${ids.join(', ')}`,
      );
      return {
        message: 'Media files deleted successfully',
        deletedCount: deleteResult.affected,
        totalRequested: ids.length,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.logException('MediaService', 'deleteFiles', error);
      throw new BadRequestException(
        error.message || 'Error deleting media files',
      );
    }
  }

  async update(updateMediaDtos: UpdateMediaDTO[], entityId: bigint, entityType: string) {
    try {
      const result: MediaEntity[] = [];

      for (const dto of updateMediaDtos) {
        const media = await this.mediaRepository.findOne({
          where: { id: dto.id },
        });
        if (!media)
          throw new NotFoundCustomException(NotFoundCustomExceptionType.MEDIA);

        Object.assign(media, dto);

        media.entityId = entityId;
        media.entityType = entityType as any;
        
        await this.mediaRepository.update({ id: dto.id }, media);

        const updated = await this.mediaRepository.findOne({
          where: { id: dto.id },
        });
        if (updated) result.push(updated);
      }

      return result;
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async findByEntityId(entityId: bigint, entityType: string) {
    try {
      const media = await this.mediaRepository.find({
        where: { entityId, entityType: entityType as any },
      });
      return media;
    } catch (error) {
      HandleException.exception(error);
    }
  }
}
