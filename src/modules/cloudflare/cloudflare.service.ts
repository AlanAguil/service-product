import { Injectable, Inject } from '@nestjs/common';
import {
  PutObjectCommand,
  DeleteObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { CustomLoggerService } from '../../common/logger/logger.service';

interface CloudflareConfig {
  bucketName: string;
  publicUrl: string;
}

@Injectable()
export class CloudflareService {
  constructor(
    @Inject('CLOUDFLARE_CLIENT') private readonly s3Client: S3Client,
    @Inject('CLOUDFLARE_CONFIG') private readonly config: CloudflareConfig,
    private readonly logger: CustomLoggerService,
  ) {}

  async uploadToCloudflare(
    file: Express.Multer.File,
  ): Promise<{ url: string }> {
    try {
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `libamaq/${uuidv4()}.${fileExtension}`;

      this.logger.logCloudflare(`Iniciando subida de archivo: ${fileName}`);

      const command = new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);

      const publicUrl = `${this.config.publicUrl}/${fileName}`;
      this.logger.logCloudflare(`Archivo subido exitosamente: ${publicUrl}`);

      return { url: publicUrl };
    } catch (error) {
      this.logger.logException(
        'CloudflareService',
        'uploadToCloudflare',
        error,
      );
      throw error;
    }
  }

  // CloudflareService method improvements
  async deleteFromCloudflare(fileUrl: string): Promise<void> {
    try {
      this.logger.logCloudflare(`Iniciando eliminación de archivo: ${fileUrl}`);

      // Check if URL is valid before attempting to parse
      if (!fileUrl || typeof fileUrl !== 'string') {
        this.logger.logCloudflare(`URL inválida o vacía: ${fileUrl}`);
        return; // Return silently instead of throwing error
      }

      const urlParts = fileUrl.split('.r2.dev/');
      if (urlParts.length !== 2) {
        this.logger.logCloudflare(
          `URL inválida de Cloudflare R2, formato incorrecto: ${fileUrl}`,
        );
        return; // Return silently instead of throwing error
      }

      const key = urlParts[1];

      const command = new DeleteObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
      });

      try {
        await this.s3Client.send(command);
        this.logger.logCloudflare(`Archivo eliminado exitosamente: ${fileUrl}`);
      } catch (error) {
        // Handle specific S3 errors silently
        if (
          error.name === 'NoSuchKey' ||
          error.name === 'NotFound' ||
          error.name === 'NoSuchBucket'
        ) {
          this.logger.logCloudflare(
            `Archivo no encontrado en Cloudflare: ${fileUrl}, Error: ${error.name}`,
          );
          return; // Return silently for these specific errors
        }
        // Log other errors but don't throw
        this.logger.logCloudflare(
          `Error al eliminar archivo: ${fileUrl}, Error: ${error.message}`,
        );
        return;
      }
    } catch (error) {
      // Log the error but don't rethrow it
      this.logger.logException(
        'CloudflareService',
        'deleteFromCloudflare',
        error,
      );
      // Return silently to prevent process interruption
      return;
    }
  }
}
