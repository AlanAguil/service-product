import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CustomLoggerService {
  private readonly logger = new Logger();

  // Códigos ANSI para colores
  private readonly colors = {
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    reset: '\x1b[0m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    white: '\x1b[37m',
    brightYellow: '\x1b[93m',
  };

  logRequest(path: string, body: any) {
    this.logger.log(`${this.colors.yellow}[REQUEST]${this.colors.reset} ${path} ${JSON.stringify(body)}`);
  }
  
  logWhatsapp(message: string) {
    this.logger.log(`${this.colors.green}[WHATSAPP]${this.colors.reset} ${message}`);
  }
  
  logFirebase(message: string) {
    this.logger.log(`${this.colors.cyan}[FIREBASE]${this.colors.reset} ${message}`);
  }

  logException(controller: string, method: string, error: any) {
    this.logger.error(
      `${this.colors.red}[EXCEPTION]${this.colors.yellow}[${controller}_${method}]${this.colors.reset} ${error.message}`,
      error.stack
    );
  }

  logEmail(content: string, info?: any) {
    this.logger.log(`${this.colors.green}[EMAIL]${this.colors.reset} ${content} ${info ? JSON.stringify(info) : ''}`);
  }

  logCloudflare(message: string) {
    this.logger.log(`${this.colors.blue}[CLOUDFLARE]${this.colors.reset} ${message}`);
  }

  logMedia(message: string) {
    this.logger.log(`${this.colors.magenta}[MEDIA]${this.colors.reset} ${message}`);
  }

  logIA(message: string) {
    this.logger.log(`${this.colors.cyan}[IA]${this.colors.reset} ${message}`);
  }

  logSQL(query: string, params?: any) {
    this.logger.log(`${this.colors.white}[SQL]${this.colors.reset} ${query} ${params ? JSON.stringify(params) : ''}`);
  }

  logProcess(message: string) {
    this.logger.log(`${this.colors.magenta}[PROCESS]${this.colors.reset} ${message}`);
  }
} 