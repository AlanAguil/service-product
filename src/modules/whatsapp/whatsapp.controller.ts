import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';
import { SendMessageDto, SendBulkMessageDto } from './model/send-message.dto';
import { QRResponseDto } from './model/qr.dto';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post('send-message')
  @ApiOperation({ summary: 'Enviar mensaje de WhatsApp' })
  @ApiResponse({ 
    status: 200, 
    description: 'Mensaje enviado correctamente',
    schema: {
      example: {
        success: true,
        message: 'Mensaje enviado correctamente'
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Error al enviar el mensaje',
    schema: {
      example: {
        success: false,
        error: 'WhatsApp no está conectado'
      }
    }
  })
  async sendMessage(@Body() body: SendMessageDto) {
    return await this.whatsappService.sendMessage(body.phone, body.message);
  }

  @Post('send-bulk-message')
  @ApiOperation({ summary: 'Enviar mensaje masivo de WhatsApp' })
  @ApiResponse({ 
    status: 200, 
    description: 'Mensajes enviados correctamente',
    schema: {
      example: {
        success: true,
        total: 2,
        successCount: 2,
        errorCount: 0,
        results: [
          { phone: '5217773280963', success: true },
          { phone: '5217773280964', success: true }
        ],
        errors: []
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Error al enviar los mensajes',
    schema: {
      example: {
        success: false,
        error: 'WhatsApp no está conectado'
      }
    }
  })
  async sendBulkMessage(@Body() body: SendBulkMessageDto) {
    return await this.whatsappService.sendBulkMessage(body.phones, body.message);
  }

  @Get('qr')
  @ApiOperation({ summary: 'Obtener código QR para conectar WhatsApp' })
  @ApiResponse({ 
    status: 200, 
    description: 'Código QR y estado de la conexión',
    type: QRResponseDto
  })
  getQRCode(): QRResponseDto {
    const qrCode = this.whatsappService.getQRCode();
    const status = this.whatsappService.getConnectionStatus();
    
    return {
      qrCode,
      ...status
    };
  }
} 