import { Injectable } from '@nestjs/common';
import { CustomLoggerService } from '../../../common/logger/logger.service';

@Injectable()
export class MessageMiddleware {
  constructor(private readonly logger: CustomLoggerService) {}

  /**
   * Envía un mensaje con delay natural simulando velocidad de escritura humana
   */
  async sendTextWithDelay(
    socket: any,
    userNumber: string,
    content: any,
    options?: {
      minDelay?: number;
      maxDelay?: number;
      charsPerSecond?: number;
      skipDelay?: boolean;
    }
  ): Promise<void> {
    try {
      // Configuración por defecto
      const config = {
        minDelay: 1000,      // Mínimo 1 segundo
        maxDelay: 4000,      // Máximo 4 segundos
        charsPerSecond: 50,  // 50 caracteres por segundo (velocidad humana)
        skipDelay: false,
        ...options
      };

      // Si skipDelay está activado, enviar inmediatamente
      if (config.skipDelay) {
        await socket.sendMessage(userNumber, content);
        return;
      }

      // Calcular delay basado en la longitud del mensaje
      let messageLength = 0;
      if (typeof content === 'string') {
        messageLength = content.length;
      } else if (content.text) {
        messageLength = content.text.length;
      } else if (content.caption) {
        messageLength = content.caption.length;
      }

      // Calcular delay: tiempo base + tiempo por caracteres
      const typingTime = Math.max(
        config.minDelay,
        Math.min(
          config.maxDelay,
          (messageLength / config.charsPerSecond) * 1000
        )
      );

      // Agregar variabilidad humana (±20%)
      const variance = typingTime * 0.2;
      const finalDelay = typingTime + (Math.random() * variance * 2 - variance);

      this.logger.logWhatsapp(
        `Enviando mensaje a ${userNumber} con delay de ${Math.round(finalDelay)}ms (${messageLength} chars)`
      );

      // Mostrar indicador de "está escribiendo" (bolitas) y esperar
      await this.showTypingIndicator(socket, userNumber);
      
      // Esperar un poco para que se vea el indicador
      await this.sleep(300);

      // Esperar el delay calculado mientras mantiene el indicador
      await this.sleep(finalDelay);

      // Quitar indicador de "está escribiendo"
      await this.hideTypingIndicator(socket, userNumber);
      
      // Pequeña pausa antes de enviar el mensaje
      await this.sleep(200);

      // Enviar el mensaje
      await socket.sendMessage(userNumber, content);

    } catch (error) {
      this.logger.logException('MessageMiddleware', 'sendTextWithDelay', error);
      // En caso de error, quitar typing indicator y enviar inmediatamente
      try {
        await this.hideTypingIndicator(socket, userNumber);
      } catch {}
      await socket.sendMessage(userNumber, content);
    }
  }

  /**
   * Muestra el indicador de "está escribiendo" (bolitas)
   */
  private async showTypingIndicator(socket: any, userNumber: string): Promise<void> {
    try {
      // Usar el método correcto de Baileys para mostrar "escribiendo"
      await socket.presenceSubscribe(userNumber);
      await socket.sendPresenceUpdate('composing', userNumber);
      this.logger.logWhatsapp(`Indicador de escritura activado para ${userNumber}`);
    } catch (error) {
      this.logger.logException('MessageMiddleware', 'showTypingIndicator', error);
    }
  }

  /**
   * Oculta el indicador de "está escribiendo"
   */
  private async hideTypingIndicator(socket: any, userNumber: string): Promise<void> {
    try {
      // Usar el método correcto de Baileys para quitar "escribiendo"
      await socket.sendPresenceUpdate('paused', userNumber);
      this.logger.logWhatsapp(`Indicador de escritura desactivado para ${userNumber}`);
    } catch (error) {
      this.logger.logException('MessageMiddleware', 'hideTypingIndicator', error);
    }
  }

  /**
   * Función auxiliar para crear delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 