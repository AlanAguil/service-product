import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';

@Module({})
export class CloudflareConfigModule {
  static forRootAsync(): DynamicModule {
    const cloudflareClientProvider = {
      provide: 'CLOUDFLARE_CLIENT',
      useFactory: (configService: ConfigService) => {
        const endpoint = configService.get<string>('CLOUDFLARE_R2_ENDPOINT');
        const accessKeyId = configService.get<string>('CLOUDFLARE_R2_ACCESS_KEY');
        const secretAccessKey = configService.get<string>('CLOUDFLARE_R2_SECRET_KEY');

        if (!endpoint || !accessKeyId || !secretAccessKey) {
          throw new Error('Faltan credenciales de Cloudflare R2');
        }

        return new S3Client({
          endpoint,
          region: 'auto',
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
      },
      inject: [ConfigService],
    };

    const cloudflareConfigProvider = {
      provide: 'CLOUDFLARE_CONFIG',
      useFactory: (configService: ConfigService) => {
        const bucketName = configService.get<string>('CLOUDFLARE_R2_BUCKET_NAME');
        const publicUrl = configService.get<string>('CLOUDFLARE_R2_PUBLIC_URL');

        if (!bucketName || !publicUrl) {
          throw new Error('Faltan valores de configuración de Cloudflare R2');
        }

        return {
          bucketName,
          publicUrl,
        };
      },
      inject: [ConfigService],
    };

    return {
      module: CloudflareConfigModule,
      imports: [ConfigModule],
      providers: [cloudflareClientProvider, cloudflareConfigProvider],
      exports: [cloudflareClientProvider, cloudflareConfigProvider],
    };
  }
} 