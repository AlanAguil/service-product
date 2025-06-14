import { Injectable, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { makeWASocket, DisconnectReason, useMultiFileAuthState, downloadMediaMessage, downloadContentFromMessage } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { CustomLoggerService } from '../../common/logger/logger.service';
import { MessageResult, MessageError, BulkMessageResponse } from './model/send-message.dto';
import { stringConstants } from '../../utils/string.constant';
import { OrderService } from '../order/order.service';
import { BillService } from '../bill/bill.service';
import { CreateBillDto } from '../bill/model/create-bill.dto';
import { CloudflareService } from '../cloudflare/cloudflare.service';
import { ReportService } from '../report/report.service';
import { IntentService } from '../intent/intent.service';
import { MessageData, IaService } from '../ia/ia.service';
import { MessageMiddleware } from './middleware/message.middleware';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class WhatsappService implements OnModuleInit {
  private sock: any;
  private qrCode: string | null = null;
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'qr_required' = 'disconnected';
  private waitingForImage: Map<string, { orderId: bigint, amount: number }> = new Map();

  // Buffer de mensajes por usuario
  private messageBuffer: Map<string, any[]> = new Map();
  // Timeouts por usuario
  private userTimeouts: Map<string, NodeJS.Timeout> = new Map();
  // Delay en milisegundos (7 segundos)
  private readonly MESSAGE_DELAY = 7000;

  // Historial de chat por usuario
  private chatHistory: Map<string, {
    summary: string;
    recentMessages: { role: 'user' | 'assistant', content: string, timestamp: Date }[];
    totalMessages: number;
  }> = new Map();

  // Configuración del historial
  private readonly MAX_RECENT_MESSAGES = 6; // Últimos 6 mensajes (3 intercambios)
  private readonly SUMMARIZE_AFTER = 10; // Crear resumen después de 10 mensajes

  constructor(
    private readonly logger: CustomLoggerService,
    @Inject(forwardRef(() => OrderService))
    private readonly orderService: OrderService,
    @Inject(forwardRef(() => BillService))
    private readonly billService: BillService,
    private readonly cloudflareService: CloudflareService,
    @Inject(forwardRef(() => ReportService))
    private readonly reportService: ReportService,
    private readonly intentService: IntentService,
    private readonly messageMiddleware: MessageMiddleware,
    private readonly iaService: IaService,
  ) { }

  async onModuleInit() {
    this.logger.logWhatsapp('Inicializando servicio de WhatsApp');
    await this.initializeConnection();
  }

  private async initializeConnection() {
    try {
      const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

      this.connectionStatus = 'connecting';
      this.logger.logWhatsapp('Iniciando conexión con WhatsApp');

      this.sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
      });

      this.sock.ev.on('connection.update', (update: any) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.qrCode = qr;
          this.connectionStatus = 'qr_required';
          this.logger.logWhatsapp('Se requiere escanear código QR');
        }

        if (connection === 'close') {
          const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
          if (shouldReconnect) {
            this.connectionStatus = 'disconnected';
            this.qrCode = null;
            this.logger.logWhatsapp('Conexión cerrada, intentando reconectar en 3 segundos');
            setTimeout(() => this.initializeConnection(), 3000);
          }
        } else if (connection === 'open') {
          this.connectionStatus = 'connected';
          this.qrCode = null;
          this.logger.logWhatsapp('Conexión establecida con WhatsApp');
          this.setupMessageHandler();
        }
      });

      this.sock.ev.on('creds.update', saveCreds);
    } catch (error) {
      this.logger.logException('WhatsappService', 'initializeConnection', error);
      throw error;
    }
  }

  private async uploadImage(buffer: Buffer): Promise<string> {
    try {
      // Crear un objeto File simulado para CloudflareService
      const file = {
        buffer,
        originalname: `payment-${Date.now()}.jpg`,
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      // Subir la imagen usando CloudflareService
      const result = await this.cloudflareService.uploadToCloudflare(file);
      return result.url;
    } catch (error) {
      this.logger.logException('WhatsappService', 'uploadImage', error);
      throw error;
    }
  }

  private async processIncomingImage(userNumber: string, message: any) {
    try {
      const caption = message.message?.imageMessage?.caption || '';
      this.logger.logWhatsapp(`Imagen recibida de ${userNumber} con texto: ${caption}`);

      // Descargar la imagen
      const buffer = await downloadMediaMessage(
        message,
        'buffer',
        {}
      );

      // Verificar si estamos esperando una imagen para pago
      if (this.waitingForImage.has(userNumber)) {
        try {
          // Subir la imagen a Cloudflare
          const imageUrl = await this.uploadImage(buffer);
          this.logger.logWhatsapp(`Imagen subida a Cloudflare: ${imageUrl}`);

          // Obtener información de la orden pendiente
          const orderInfo = this.waitingForImage.get(userNumber);

          if (orderInfo) {
            // Crear el pago
            const createBillDto: CreateBillDto = {
              orderId: orderInfo.orderId,
              amount: orderInfo.amount,
              paymentStatus: 'VERIFICATION',
              receiptUrl: imageUrl,
              billConcept: 'Pago vía WhatsApp',
              createdBy: 'WHATSAPP_BOT'
            };

            this.logger.logWhatsapp(`Creando pago para orden #${orderInfo.orderId} con monto $${orderInfo.amount}`);
            const bill = await this.billService.create(createBillDto);
            this.logger.logWhatsapp(`Pago creado exitosamente con ID: ${bill?.id}`);

            // Enviar confirmación
            await this.sock.sendMessage(userNumber, {
              text: `¡Gracias! Tu comprobante de pago ha sido recibido y está en proceso de verificación. ID de pago: ${bill?.id || 'N/A'}`
            });

            // Resetear el estado de espera
            this.waitingForImage.delete(userNumber);
          }
        } catch (error) {
          this.logger.logException('WhatsappService', 'processPaymentImage', error);
          await this.sock.sendMessage(userNumber, {
            text: 'Lo siento, hubo un error al procesar tu pago. Por favor, intenta nuevamente.'
          });
          this.waitingForImage.delete(userNumber);
        }
      } else {
        // Si no estamos esperando una imagen para pago, guardarla localmente
        const mediaDir = path.join(process.cwd(), 'media');
        if (!fs.existsSync(mediaDir)) {
          fs.mkdirSync(mediaDir, { recursive: true });
        }

        const filename = `image_${Date.now()}.jpg`;
        const filePath = path.join(mediaDir, filename);
        fs.writeFileSync(filePath, buffer);

        await this.sock.sendMessage(userNumber, {
          text: `✅ He recibido tu imagen y la he guardado como ${filename}.${caption ? `\n\nMensaje adjunto: "${caption}"` : ''}`
        });

        // Si hay texto en la imagen, procesarlo como un mensaje normal
        if (caption && caption.toLowerCase() === 'pago') {
          // Procesar el mensaje de pago
          const rawPhoneNumber = userNumber.split('@')[0];
          let phoneNumber;
          if (rawPhoneNumber.startsWith('52')) {
            phoneNumber = '+' + rawPhoneNumber.replace(/^521/, '52');
          } else {
            phoneNumber = '+52' + rawPhoneNumber;
          }

          this.logger.logWhatsapp(`Buscando órdenes para el número: ${phoneNumber} (número original: ${rawPhoneNumber})`);

          const orders = await this.orderService.findByPhoneNumber(phoneNumber) || [];
          this.logger.logWhatsapp(`Órdenes encontradas: ${orders.length}`);

          const pendingOrders = orders.filter(order => {
            const amountPaid = order.orderHistory?.total || 0;
            const totalAmount = order.orderHistory?.total || 0;
            const isPending = amountPaid < totalAmount;
            this.logger.logWhatsapp(`Orden #${order.id}: Monto pagado: $${amountPaid}, Monto total: $${totalAmount}, Pendiente: ${isPending}`);
            return isPending;
          });

          if (pendingOrders.length > 0) {
            const order = pendingOrders[0];
            const pendingAmount = (order.orderHistory?.total || 0) - (order.orderHistory?.total || 0);

            await this.sock.sendMessage(userNumber, {
              text: `Hola ${order.orderHistory?.receiver}, tienes un pago pendiente de $${pendingAmount} para tu orden #${order.id}. ¿Deseas realizar el pago ahora?`
            });

            this.waitingForImage.set(userNumber, {
              orderId: order.id,
              amount: pendingAmount
            });
          } else {
            await this.sock.sendMessage(userNumber, {
              text: 'No tienes pagos pendientes en este momento.'
            });
          }
        }
      }
    } catch (error) {
      this.logger.logException('WhatsappService', 'processIncomingImage', error);
      await this.sock.sendMessage(userNumber, {
        text: 'Lo siento, tuve problemas al procesar la imagen que enviaste.'
      });
    }
  }

  private setupMessageHandler() {
    this.sock.ev.on('messages.upsert', async (m: any) => {
      try {
        const msg = m.messages[0];

        // Ignorar mensajes de grupos
        if (msg.key.remoteJid.endsWith('@g.us')) {
          return;
        }

        // Ignorar mensajes enviados por el bot (mensajes propios)
        if (msg.key.fromMe) {
          this.logger.logWhatsapp('Ignorando mensaje propio del bot');
          return;
        }

        const sender = msg.key.remoteJid;

        // Agregar mensaje al buffer del usuario
        this.addMessageToBuffer(sender, msg);

      } catch (error) {
        this.logger.logException('WhatsappService', 'messageHandler', error);
      }
    });
  }

  private addMessageToBuffer(sender: string, message: any) {
    try {
      // Inicializar buffer del usuario si no existe
      if (!this.messageBuffer.has(sender)) {
        this.messageBuffer.set(sender, []);
      }

      // Agregar mensaje al buffer
      const userBuffer = this.messageBuffer.get(sender);
      if (userBuffer) {
        userBuffer.push(message);
        this.logger.logWhatsapp(`Mensaje agregado al buffer de ${sender}. Total en buffer: ${userBuffer.length}`);
      }

      // Cancelar timeout anterior si existe
      if (this.userTimeouts.has(sender)) {
        clearTimeout(this.userTimeouts.get(sender));
      }

      // Crear nuevo timeout para procesar mensajes después de 7 segundos
      const timeout = setTimeout(() => {
        this.processBufferedMessages(sender);
      }, this.MESSAGE_DELAY);

      this.userTimeouts.set(sender, timeout);

    } catch (error) {
      this.logger.logException('WhatsappService', 'addMessageToBuffer', error);
    }
  }

  private async processBufferedMessages(sender: string) {
    try {
      const userBuffer = this.messageBuffer.get(sender);

      if (!userBuffer || userBuffer.length === 0) {
        return;
      }

      this.logger.logWhatsapp(`Procesando ${userBuffer.length} mensaje(s) en buffer de ${sender}`);

      // Convertir mensajes al formato MessageData para el IntentService
      const messagesData = await this.convertToMessageData(userBuffer);

      // Obtener contexto histórico del usuario
      const chatContext = this.getChatContext(sender);

      // Procesar con el IntentService que usa Gemini (incluyendo contexto)
      const geminiResponse = await this.intentService.handleUserMessagesWithContext(messagesData, sender, chatContext);

      // Agregar mensajes al historial
      this.addToHistory(sender, messagesData, geminiResponse);

      // Enviar la respuesta de Gemini al usuario con delay natural
      await this.sendMessageWithDelay(sender, { text: geminiResponse });
      this.logger.logWhatsapp(`Respuesta de Gemini enviada a ${sender}`);

      // Limpiar buffer y timeout del usuario
      this.messageBuffer.delete(sender);
      this.userTimeouts.delete(sender);

    } catch (error) {
      this.logger.logException('WhatsappService', 'processBufferedMessages', error);
    }
  }

  private async convertToMessageData(messages: any[]): Promise<MessageData[]> {
    const messageDataArray: MessageData[] = [];

    for (let index = 0; index < messages.length; index++) {
      const msg = messages[index];
      const messageData: MessageData = {
        messageNumber: index + 1,
        type: 'other'
      };

      const messageContent = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

      if (messageContent) {
        messageData.type = 'text';
        messageData.content = messageContent;
      } else if (msg.message?.imageMessage) {
        messageData.type = 'image';
        messageData.caption = msg.message.imageMessage.caption || undefined;

        // Descargar la imagen para enviarla a Gemini
        try {
          const buffer = await downloadMediaMessage(msg, 'buffer', {});
          messageData.imageBuffer = buffer;
          this.logger.logWhatsapp(`Imagen descargada para análisis de Gemini (${buffer.length} bytes)`);
        } catch (error) {
          this.logger.logException('WhatsappService', 'downloadImageForGemini', error);
        }
      } else if (msg.message?.documentMessage) {
        messageData.type = 'document';
        messageData.fileName = msg.message.documentMessage.fileName || undefined;
      } else if (msg.message?.audioMessage) {
        try {
          this.logger.logWhatsapp('Mensaje de audio recibido, iniciando transcripción.');
          const buffer = await downloadMediaMessage(
            msg,
            'buffer',
            {}
          );

          // Transcribir el audio usando IaService
          const transcribedText = await this.iaService.transcribeAudio(buffer as Buffer, 'audio/ogg');

          if (transcribedText && transcribedText.trim().length > 0) {
            messageData.type = 'text'; // Tratar como mensaje de texto
            messageData.content = `[Audio transcrito]: ${transcribedText}`;
            this.logger.logWhatsapp(`Audio transcrito exitosamente: "${transcribedText}"`);
          } else {
            this.logger.logWhatsapp('La transcripción del audio no produjo texto. Se manejará como audio.');
            messageData.type = 'audio';
          }
        } catch (error) {
          this.logger.logException('WhatsappService', 'transcribeAudioMessage', error);
          messageData.type = 'audio'; // Mantener como audio en caso de error
        }
      } else if (msg.message?.videoMessage) {
        messageData.type = 'video';
      }

      messageDataArray.push(messageData);
    }

    return messageDataArray;
  }

  private getChatContext(sender: string): { summary: string; recentMessages: any[] } {
    const history = this.chatHistory.get(sender);

    if (!history) {
      return {
        summary: '',
        recentMessages: []
      };
    }

    return {
      summary: history.summary,
      recentMessages: history.recentMessages
    };
  }

  private addToHistory(sender: string, messagesData: MessageData[], botResponse: string) {
    try {
      // Inicializar historial si no existe
      if (!this.chatHistory.has(sender)) {
        this.chatHistory.set(sender, {
          summary: '',
          recentMessages: [],
          totalMessages: 0
        });
      }

      const history = this.chatHistory.get(sender)!;

      // Agregar mensajes del usuario
      messagesData.forEach(msg => {
        let userContent = '';
        switch (msg.type) {
          case 'text':
            userContent = msg.content || '';
            break;
          case 'image':
            userContent = `[Imagen${msg.caption ? `: ${msg.caption}` : ''}]`;
            break;
          default:
            userContent = `[${msg.type}]`;
        }

        history.recentMessages.push({
          role: 'user',
          content: userContent,
          timestamp: new Date()
        });
      });

      // Agregar respuesta del bot
      history.recentMessages.push({
        role: 'assistant',
        content: botResponse,
        timestamp: new Date()
      });

      history.totalMessages += messagesData.length + 1;

      // Mantener solo los mensajes recientes
      if (history.recentMessages.length > this.MAX_RECENT_MESSAGES) {
        history.recentMessages = history.recentMessages.slice(-this.MAX_RECENT_MESSAGES);
      }

      // Crear resumen si es necesario
      if (history.totalMessages >= this.SUMMARIZE_AFTER && !history.summary) {
        this.createSummaryAsync(sender);
      }

      this.logger.logWhatsapp(`Historial actualizado para ${sender}: ${history.totalMessages} mensajes totales`);
    } catch (error) {
      this.logger.logException('WhatsappService', 'addToHistory', error);
    }
  }

  private async createSummaryAsync(sender: string) {
    try {
      const history = this.chatHistory.get(sender);
      if (!history || history.summary) return;

      // Crear resumen usando el IntentService
      const summary = await this.intentService.createChatSummary(history.recentMessages);
      history.summary = summary;

      this.logger.logWhatsapp(`Resumen creado para ${sender}: ${summary.substring(0, 100)}...`);
    } catch (error) {
      this.logger.logException('WhatsappService', 'createSummaryAsync', error);
    }
  }

  private async resendImages(sender: string, messages: any[]) {
    try {
      const imageMessages = messages.filter(msg => msg.message?.imageMessage);

      for (let i = 0; i < imageMessages.length; i++) {
        const msg = imageMessages[i];

        this.logger.logWhatsapp(`Reenviando imagen ${i + 1} a ${sender}`);

        // Descargar la imagen
        const buffer = await downloadMediaMessage(msg, 'buffer', {});

        // Reenviar la imagen
        await this.sock.sendMessage(sender, {
          image: buffer,
          caption: `Imagen ${i + 1} que me enviaste`
        });

        this.logger.logWhatsapp(`Imagen ${i + 1} reenviada exitosamente a ${sender}`);
      }
    } catch (error) {
      this.logger.logException('WhatsappService', 'resendImages', error);
      await this.sock.sendMessage(sender, {
        text: 'Hubo un error al reenviar las imágenes.'
      });
    }
  }

  private analyzeMessages(messages: any[]): string {
    try {
      const totalMessages = messages.length;

      let response = `${totalMessages} mensaje(s):\n\n`;

      // Listar cada mensaje numerado
      messages.forEach((msg, index) => {
        const messageNumber = index + 1;

        if (msg.message?.conversation) {
          // Mensaje de texto
          response += `${messageNumber}. Texto: "${msg.message.conversation}"\n`;
        } else if (msg.message?.imageMessage) {
          // Mensaje con imagen
          const caption = msg.message.imageMessage.caption || '';
          response += `${messageNumber}. Imagen`;
          if (caption) {
            response += ` con texto: "${caption}"`;
          }
          response += '\n';
        } else if (msg.message?.documentMessage) {
          // Documento
          const fileName = msg.message.documentMessage.fileName || 'documento';
          response += `${messageNumber}. Documento: ${fileName}\n`;
        } else if (msg.message?.audioMessage) {
          // Audio
          response += `${messageNumber}. Audio\n`;
        } else if (msg.message?.videoMessage) {
          // Video
          response += `${messageNumber}. Video\n`;
        } else {
          // Otro tipo de mensaje
          response += `${messageNumber}. Mensaje (tipo no identificado)\n`;
        }
      });

      return response.trim();
    } catch (error) {
      this.logger.logException('WhatsappService', 'analyzeMessages', error);
      return 'Hola! Recibí tus mensajes.';
    }
  }

  private async processMessage(sender: string, msg: any) {
    try {
      // Por ahora solo responder con "hola" después de los 7 segundos
      await this.sock.sendMessage(sender, { text: 'hola' });
      this.logger.logWhatsapp(`Respondido con "hola" a ${sender}`);

      // TODO: Implementar lógica completa más tarde
      // // Procesar imagen si existe
      // if (msg.message?.imageMessage) {
      //   await this.processIncomingImage(sender, msg);
      //   return;
      // }

      // // Procesar mensaje de texto
      // if (msg.message?.conversation) {
      //   const messageText = msg.message.conversation.toLowerCase();

      //   // Procesar solicitud de reporte
      //   if (messageText.includes('reporte')) {
      //     await this.handleReportRequest(sender, messageText);
      //     return;
      //   }

      //   // Procesar solicitud de pago
      //   if (messageText === 'pago') {
      //     await this.processPaymentRequest(sender);
      //     return;
      //   }
      // }
    } catch (error) {
      this.logger.logException('WhatsappService', 'processMessage', error);
    }
  }

  private async processPaymentRequest(sender: string) {
    try {
      // Obtener el número de teléfono en formato correcto
      const rawPhoneNumber = sender.split('@')[0];
      let phoneNumber;
      if (rawPhoneNumber.startsWith('52')) {
        phoneNumber = '+' + rawPhoneNumber.replace(/^521/, '52');
      } else {
        phoneNumber = '+52' + rawPhoneNumber;
      }

      this.logger.logWhatsapp(`Buscando órdenes para el número: ${phoneNumber}`);

      const orders = await this.orderService.findByPhoneNumber(phoneNumber) || [];
      this.logger.logWhatsapp(`Órdenes encontradas: ${orders.length}`);

      const pendingOrders = orders.filter(order => {
        const amountPaid = order.orderHistory?.total || 0;
        const totalAmount = order.orderHistory?.total || 0;
        const isPending = amountPaid < totalAmount;
        this.logger.logWhatsapp(`Orden #${order.id}: Monto pagado: $${amountPaid}, Monto total: $${totalAmount}, Pendiente: ${isPending}`);
        return isPending;
      });

      if (pendingOrders.length > 0) {
        const order = pendingOrders[0];
        const pendingAmount = (order.orderHistory?.total || 0) - (order.orderHistory?.total || 0);

        await this.sock.sendMessage(sender, {
          text: `Hola ${order.orderHistory?.receiver}, tienes un pago pendiente de $${pendingAmount} para tu orden #${order.id}. Por favor, envía una imagen de tu comprobante de pago.`
        });

        this.waitingForImage.set(sender, {
          orderId: order.id,
          amount: pendingAmount
        });
      } else {
        await this.sock.sendMessage(sender, {
          text: 'No tienes pagos pendientes en este momento.'
        });
      }
    } catch (error) {
      this.logger.logException('WhatsappService', 'processPaymentRequest', error);
      await this.sock.sendMessage(sender, {
        text: 'Lo siento, hubo un error al procesar tu solicitud de pago.'
      });
    }
  }



  getQRCode(): string | null {
    return this.qrCode;
  }

  getConnectionStatus() {
    return {
      status: this.connectionStatus,
      qrRequired: this.connectionStatus === 'qr_required'
    };
  }

  /**
   * Método auxiliar para enviar mensajes con retroceso natural
   * Este método debe usarse en lugar de sendMessage directo del socket
   */
  async sendMessageWithDelay(userNumber: string, content: any, options?: {
    minDelay?: number;
    maxDelay?: number;
    charsPerSecond?: number;
    skipDelay?: boolean;
  }) {
    return await this.messageMiddleware.sendTextWithDelay(this.sock, userNumber, content, options);
  }

  async sendMessage(phone: string, message: string | ((...args: any[]) => string), ...args: any[]) {
    try {
      if (this.connectionStatus !== 'connected') {
        this.logger.logWhatsapp(`Intento de envío fallido - WhatsApp no está conectado. Estado: ${this.connectionStatus}`);
        return {
          success: false,
          error: 'WhatsApp no está conectado'
        };
      }

      const formattedPhone = this.formatPhoneNumber(phone);
      const formattedMessage = typeof message === 'function' ? message(...args) : message;

      this.logger.logWhatsapp(`Enviando mensaje a ${formattedPhone}`);
      await this.sock.sendMessage(formattedPhone, { text: formattedMessage });

      this.logger.logWhatsapp(`Mensaje enviado exitosamente a ${formattedPhone}`);
      return { success: true, message: 'Mensaje enviado correctamente' };
    } catch (error) {
      this.logger.logException('WhatsappService', 'sendMessage', error);
      return { success: false, error: error.message };
    }
  }

  async sendBulkMessage(phones: string[], message: string | ((...args: any[]) => string), ...args: any[]) {
    try {
      if (this.connectionStatus !== 'connected') {
        this.logger.logWhatsapp(`Intento de envío masivo fallido - WhatsApp no está conectado. Estado: ${this.connectionStatus}`);
        return {
          success: false,
          total: 0,
          successCount: 0,
          errorCount: 0,
          results: [],
          errors: [],
          error: 'WhatsApp no está conectado'
        };
      }

      this.logger.logWhatsapp(`Iniciando envío masivo a ${phones.length} números`);

      const results: MessageResult[] = [];
      const errors: MessageError[] = [];
      const formattedMessage = typeof message === 'function' ? message(...args) : message;

      for (const phone of phones) {
        try {
          const formattedPhone = this.formatPhoneNumber(phone);
          this.logger.logWhatsapp(`Enviando mensaje a ${formattedPhone}`);
          await this.sock.sendMessage(formattedPhone, { text: formattedMessage });
          results.push({ phone, success: true });
        } catch (error) {
          this.logger.logException('WhatsappService', 'sendBulkMessage', error);
          errors.push({ phone, error: error.message });
        }
      }

      const successCount = results.length;
      const errorCount = errors.length;

      this.logger.logWhatsapp(`Envío masivo completado: ${successCount} exitosos, ${errorCount} fallidos`);

      return {
        success: true,
        total: phones.length,
        successCount,
        errorCount,
        results,
        errors
      };
    } catch (error) {
      this.logger.logException('WhatsappService', 'sendBulkMessage', error);
      return {
        success: false,
        total: 0,
        successCount: 0,
        errorCount: 0,
        results: [],
        errors: [],
        error: error.message
      };
    }
  }

  async sendDocument(phone: string, buffer: Buffer, filename: string, caption?: string) {
    try {
      if (this.connectionStatus !== 'connected') {
        this.logger.logWhatsapp(`Intento de envío de documento fallido - WhatsApp no está conectado. Estado: ${this.connectionStatus}`);
        return {
          success: false,
          error: 'WhatsApp no está conectado'
        };
      }

      const formattedPhone = this.formatPhoneNumber(phone);
      this.logger.logWhatsapp(`Enviando documento a ${formattedPhone}`);

      await this.sock.sendMessage(formattedPhone, {
        document: buffer,
        fileName: filename,
        mimetype: this.getMimeType(filename),
        caption: caption
      });

      this.logger.logWhatsapp(`Documento ${filename} enviado exitosamente a ${formattedPhone}`);
      return { success: true, message: 'Documento enviado correctamente' };
    } catch (error) {
      this.logger.logException('WhatsappService', 'sendDocument', error);
      return { success: false, error: error.message };
    }
  }

  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
      case '.pdf':
        return 'application/pdf';
      case '.xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      // Agrega más tipos MIME si es necesario
      default:
        return 'application/octet-stream';
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Eliminar todos los caracteres no numéricos
    let cleaned = phone.replace(/\D/g, '');

    // Si el número tiene 12 dígitos y comienza con 52, agregar 1 después del código de país
    if (cleaned.length === 12 && cleaned.startsWith('52')) {
      cleaned = cleaned.slice(0, 2) + '1' + cleaned.slice(2);
    }

    return `${cleaned}@s.whatsapp.net`;
  }
}
