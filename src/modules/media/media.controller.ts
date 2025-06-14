import { Controller, Post, Body, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { UpdateMediaDTO } from './model/update.media.dto';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files'))
  @ApiOperation({ summary: 'Subir archivos a Cloudflare y registrarlos en la base de datos' })
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
    return await this.mediaService.uploadFiles(files);
  }
  
  @Post('delete')
  @ApiOperation({ summary: 'Eliminar un archivo multimedia' })
  @ApiBody({ type: [BigInt] })
  @ApiResponse({ status: 200, description: 'Archivo eliminado exitosamente' })
  @ApiResponse({ status: 400, description: 'Error en la solicitud' })
  async deleteMedia(@Body() ids: bigint[]) {
    return await this.mediaService.deleteFiles(ids);
  }
}
