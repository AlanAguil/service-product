import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  Delete,
  Body,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { CloudflareService } from './cloudflare.service';

@Controller('cloudflare')
export class CloudflareController {
  constructor(private readonly cloudflareService: CloudflareService) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files'))
  @ApiOperation({
    summary: 'Subir archivos a Cloudflare y registrarlos en la base de datos',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Archivos a subir',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Error en la solicitud' })
  async uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    const uploadPromises = files.map(file => this.cloudflareService.uploadToCloudflare(file));
    return await Promise.all(uploadPromises);
  }

  @Delete('delete')
  @ApiOperation({ summary: 'Eliminar un archivo de Cloudflare' })
  @ApiBody({ schema: { type: 'object', properties: { fileUrl: { type: 'string', description: 'URL del archivo a eliminar' } } } })
  @ApiResponse({ status: 200, description: 'Archivo eliminado (o no encontrado)' })
  @ApiResponse({ status: 400, description: 'Error en la solicitud' })
  async deleteFile(@Body('fileUrl') fileUrl: string) {
    await this.cloudflareService.deleteFromCloudflare(fileUrl);
    return;
  }
}
