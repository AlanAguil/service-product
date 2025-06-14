import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { IaService, MessageData, ComprehensiveIntent } from '../ia/ia.service';
import { CustomLoggerService } from '../../common/logger/logger.service';
import { ReportService } from '../report/report.service';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { stringConstants } from '../../utils/string.constant';
import { WhatsappService } from '../whatsapp/whatsapp.service';

// Consulta SQL estándar para obtener TODOS los productos y refacciones
const GET_ALL_PRODUCTS_QUERY = `
SELECT 
    p.id, 
    p.name, 
    COALESCE(p.description, p.short_description, '') as description, 
    p.price, 
    p.stock, 
    c.name as category_name, 
    b.name as brand_name, 
    (SELECT url FROM media WHERE entity_type = 'PRODUCT' AND entity_id = p.id AND file_type = 'IMAGE' AND status = 'ACTIVE' ORDER BY display_order ASC, id ASC LIMIT 1) as image_url,
    'product' as entity_type
FROM product p 
LEFT JOIN category c ON p.category_id = c.id 
LEFT JOIN brand b ON p.brand_id = b.id 
WHERE p.deleted_at IS NULL

UNION ALL  

SELECT 
    sp.id, 
    sp.name, 
    COALESCE(sp.description, '') as description, 
    0 as price, 
    sp.stock, 
    'Refacciones' as category_name, 
    '' as brand_name, 
    (SELECT url FROM media WHERE entity_type = 'SPARE_PART' AND entity_id = sp.id AND file_type = 'IMAGE' AND status = 'ACTIVE' ORDER BY display_order ASC, id ASC LIMIT 1) as image_url,
    'spare_part' as entity_type
FROM spare_part sp 
WHERE sp.deleted_at IS NULL
ORDER BY name ASC;
`;

@Injectable()
export class IntentService {
  // Cache para información de usuarios (TTL: 5 minutos)
  private userCache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos en milisegundos
  private productSearchCache = new Map<string, { products: any[]; timestamp: number }>();
  private readonly PRODUCT_SEARCH_TTL = 10 * 60 * 1000; // 10 minutos para productos
  
  // Cache para estructura de base de datos (TTL: 30 minutos)
  private dbStructureCache: { data: string; timestamp: number } | null = null;
  private readonly DB_STRUCTURE_TTL = 30 * 60 * 1000; // 30 minutos

  constructor(
    private readonly iaService: IaService,
    private readonly logger: CustomLoggerService,
    @Inject(forwardRef(() => ReportService))
    private readonly reportService: ReportService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => WhatsappService))
    private readonly whatsappService: WhatsappService,
  ) {}

  async handleUserMessages(messages: MessageData[], phoneNumber: string): Promise<string> {
    try {
      this.logger.logWhatsapp(`Procesando intención para ${phoneNumber} con ${messages.length} mensaje(s)`);

      // Primer paso: obtener información del usuario si existe
      const userInfo = await this.getUserInfo(phoneNumber);

      // Segundo paso: detectar la intención inicial del cliente
      const initialResponse = await this.iaService.detectClientIntent(messages);
      
      // Tercer paso: verificar si solicita un reporte
      const needsReport = await this.analyzeIfNeedsReport(messages);
      if (needsReport.needs) {
        return await this.handleReportRequest(needsReport, phoneNumber, userInfo);
      }

      // Cuarto paso: analizar si necesita buscar información de productos/categorías/marcas
      const needsProductInfo = await this.iaService.analyzeProductInformationNeeds(
        messages.filter(msg => msg.type === 'text' && msg.content).map(msg => msg.content).join(' ')
      );
      
      if (needsProductInfo.needs) {
        // Verificar permisos de consulta de productos
        if (!this.hasProductQueryPermissions(userInfo)) {
          return 'Lo siento, necesitas registrarte para consultar información de productos. ¿Te gustaría que te ayude con el proceso de registro?';
        }

        this.logger.logWhatsapp(`Cliente necesita información de ${needsProductInfo.type}: ${needsProductInfo.query}`);
        
        // Usar consultas SQL directas con permisos aplicados
        const databaseInfo = await this.searchWithDirectSQL(needsProductInfo, messages, userInfo);
        
        // Generar respuesta final con la información encontrada y datos del usuario
        const finalResponse = await this.iaService.generateResponseWithProductInfoAndUser(
          messages,
          initialResponse,
          databaseInfo,
          userInfo
        );
        
        this.logger.logWhatsapp(`Respuesta final con información de productos para ${phoneNumber}`);
        return finalResponse;
      }
      
      // Si no necesita información de productos, pero tenemos datos del usuario, personalizar respuesta
      if (userInfo) {
        const personalizedResponse = await this.iaService.generatePersonalizedResponse(
          messages,
          initialResponse,
          userInfo
        );
        
        this.logger.logWhatsapp(`Respuesta personalizada para ${phoneNumber}`);
        return personalizedResponse;
      }
      
      this.logger.logWhatsapp(`Respuesta de Gemini para ${phoneNumber}: ${initialResponse.substring(0, 100)}...`);
      return initialResponse;
    } catch (error) {
      this.logger.logException('IntentService', 'handleUserMessages', error);
      return 'Lo siento, no pude procesar tu mensaje en este momento. Por favor, intenta nuevamente.';
    }
  }

  async handleUserMessagesWithContext(
    messages: MessageData[], 
    phoneNumber: string, 
    context: { summary: string; recentMessages: any[] }
  ): Promise<string> {
    try {
      this.logger.logWhatsapp(`Procesando intención con contexto para ${phoneNumber} con ${messages.length} mensaje(s)`);

      // 1. Get user info
      const userInfo = await this.getUserInfo(phoneNumber);

      // 2. Make a single call to AI for comprehensive analysis
      const analysis: ComprehensiveIntent = await this.iaService.analyzeIntentAndEntities(messages, context);
      
      this.logger.logProcess(`=== ANÁLISIS COMPRENSIVO DE IA ===`);
      this.logger.logProcess(`Intención: ${analysis.intent}`);
      this.logger.logProcess(`Entidades: ${JSON.stringify(analysis.entities, null, 2)}`);
      this.logger.logProcess(`Respuesta sugerida: ${analysis.suggested_response}`);

      const { intent, entities } = analysis;

      // 3. Route based on intent
      switch (intent) {
        case 'report_request':
          this.logger.logProcess(`Detectado tipo de reporte: ${entities.report_type}`);
          const reportRequest = {
            needs: true,
            type: entities.report_type || 'custom_report',
            params: entities.report_params
          };
          return await this.handleReportRequest(reportRequest, phoneNumber, userInfo);

        case 'quotation_request':
          this.logger.logProcess(`Detectada solicitud de cotización`);
          const quotationRequest = {
            needs: true,
            type: 'quotation',
            params: entities
          };
          return await this.handleReportRequest(quotationRequest, phoneNumber, userInfo);

        case 'product_query':
          if (!this.hasProductQueryPermissions(userInfo)) {
            return 'Lo siento, necesitas registrarte para consultar información de productos. ¿Te gustaría que te ayude con el proceso de registro?';
          }
          this.logger.logWhatsapp(`Cliente necesita información de producto: ${entities.query}`);
          
          const searchRequest = { type: 'product', query: entities.query || '' };
          const databaseInfo = await this.searchWithDirectSQLAndContext(searchRequest, messages, context, userInfo);
          
          // Generate final response using the database info
          const finalResponse = await this.iaService.generateResponseWithProductInfoContextAndUser(
            messages,
            context,
            analysis.suggested_response, // Use the suggested response as a base
            databaseInfo,
            userInfo
          );
          
          this.logger.logWhatsapp(`Respuesta final con información de productos y contexto para ${phoneNumber}`);
          return finalResponse;

        case 'greeting':
        case 'general_question':
        case 'other':
        default:
          // For simple cases, we can use the suggested response or generate a personalized one.
          if (userInfo) {
            const personalizedResponse = await this.iaService.generatePersonalizedResponseWithContext(
              messages,
              context,
              analysis.suggested_response,
              userInfo
            );
            this.logger.logWhatsapp(`Respuesta personalizada con contexto para ${phoneNumber}`);
            return personalizedResponse;
          }
          
          this.logger.logWhatsapp(`Respuesta de Gemini con contexto para ${phoneNumber}: ${analysis.suggested_response.substring(0, 100)}...`);
          return analysis.suggested_response;
      }
    } catch (error) {
      this.logger.logException('IntentService', 'handleUserMessagesWithContext', error);
      return 'Lo siento, no pude procesar tu mensaje en este momento. Por favor, intenta nuevamente.';
    }
  }

  async createChatSummary(recentMessages: any[]): Promise<string> {
    try {
      this.logger.logWhatsapp(`Creando resumen de chat con ${recentMessages.length} mensajes`);

      // Crear resumen usando Gemini
      const summary = await this.iaService.createConversationSummary(recentMessages);
      
      this.logger.logWhatsapp(`Resumen creado: ${summary.substring(0, 100)}...`);
      
      return summary;
    } catch (error) {
      this.logger.logException('IntentService', 'createChatSummary', error);
      return 'Conversación sobre consultas generales.';
    }
  }

  private async getUserInfo(phoneNumber: string): Promise<any> {
    try {
      // Limpiar el número de teléfono para buscar en la base de datos
      const cleanPhone = this.cleanPhoneNumber(phoneNumber);
      this.logger.logWhatsapp(`Buscando información del usuario con teléfono: ${cleanPhone}`);
      
      const cachedUserInfo = this.userCache.get(cleanPhone);
      if (cachedUserInfo && Date.now() - cachedUserInfo.timestamp < this.CACHE_TTL) {
        this.logger.logWhatsapp('Usuario encontrado en cache');
        return cachedUserInfo.data;
      }

      // Usar consulta SQL directa para buscar usuario
      const query = `
        SELECT id, name, last_name, email, phone_number, role, status 
        FROM user 
        WHERE phone_number = ? AND deleted_at IS NULL 
        LIMIT 1
      `;
      
      this.logger.logWhatsapp(`Ejecutando consulta de usuario: ${query}`);
      const users = await this.dataSource.query(query, [cleanPhone]);
      
      if (users && users.length > 0) {
        const user = users[0];
        this.logger.logWhatsapp(`Usuario encontrado: ${user.name} ${user.last_name} - Rol: ${user.role}`);
        const userInfo = {
          id: user.id,
          name: user.name,
          lastName: user.last_name,
          email: user.email,
          role: user.role,
          status: user.status,
          isRegistered: true,
          phoneNumber: cleanPhone
        };
        this.userCache.set(cleanPhone, { data: userInfo, timestamp: Date.now() });
        return userInfo;
      } else {
        this.logger.logWhatsapp(`Usuario no registrado con teléfono: ${cleanPhone}`);
        const userInfo = {
          isRegistered: false,
          phoneNumber: cleanPhone
        };
        this.userCache.set(cleanPhone, { data: userInfo, timestamp: Date.now() });
        return userInfo;
      }
    } catch (error) {
      this.logger.logException('IntentService', 'getUserInfo', error);
      return {
        isRegistered: false,
        phoneNumber: this.cleanPhoneNumber(phoneNumber)
      };
    }
  }

  /**
   * Limpia el número de teléfono para buscar en la base de datos
   * @param phoneNumber Número de teléfono original (ej: 5217773280963@s.whatsapp.net)
   * @returns Número limpio (ej: +527773280963)
   */
  private cleanPhoneNumber(phoneNumber: string): string {
    // Remover @s.whatsapp.net si existe
    let cleaned = phoneNumber.replace('@s.whatsapp.net', '');
    
    // Remover @c.us si existe
    cleaned = cleaned.replace('@c.us', '');
    
    // Remover + si existe para trabajar solo con números
    cleaned = cleaned.replace('+', '');
    
    // Si empieza con 521 (México con 1 extra), quitar el 1
    if (cleaned.startsWith('521') && cleaned.length === 13) {
      cleaned = '52' + cleaned.substring(3); // Quitar el 1 entre 52 y la lada
    }
    
    // Si empieza con 52 y tiene 12 dígitos, está correcto
    if (cleaned.startsWith('52') && cleaned.length === 12) {
      return '+' + cleaned;
    }
    
    // Si solo tiene 10 dígitos (número local), agregar +52
    if (cleaned.length === 10) {
      return '+52' + cleaned;
    }
    
    // Si tiene 11 dígitos y empieza con 1, podría ser 1 + 10 dígitos
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return '+52' + cleaned.substring(1); // Quitar el 1 inicial
    }
    
    // Por defecto, agregar + si no lo tiene
    return '+' + cleaned;
  }

  /**
   * Obtiene la estructura de la base de datos para que la IA entienda las tablas
   */
  private async getDatabaseStructure(): Promise<string> {
    try {
      // Verificar cache
      if (this.dbStructureCache && Date.now() - this.dbStructureCache.timestamp < this.DB_STRUCTURE_TTL) {
        return this.dbStructureCache.data;
      }

      this.logger.logWhatsapp('Obteniendo estructura de base de datos...');

      // Obtener estructura de las tablas principales
      const tables = ['product', 'category', 'brand', 'user', 'media'];
      const structure = await Promise.all(
        tables.map(async (table) => {
          try {
            const createTableResult = await this.dataSource.query(`SHOW CREATE TABLE ${table}`);
            return {
              table,
              structure: createTableResult[0]['Create Table']
            };
          } catch (error) {
            this.logger.logException('IntentService', 'getDatabaseStructure', error);
            return { table, structure: `Error obteniendo estructura de ${table}` };
          }
        })
      );

      const structureText = structure.map(s => 
        `TABLA: ${s.table}\n${s.structure}\n\n`
      ).join('');

      // Guardar en cache
      this.dbStructureCache = {
        data: structureText,
        timestamp: Date.now()
      };

      return structureText;
    } catch (error) {
      this.logger.logException('IntentService', 'getDatabaseStructure', error);
      return 'Error obteniendo estructura de base de datos';
    }
  }

  /**
   * Ejecuta una consulta SQL segura en la base de datos
   */
  private async executeSQL(query: string): Promise<any> {
    try {
      this.logger.logSQL(`Consulta recibida: ${query}`);
      
      // Limpiar la consulta removiendo saltos de línea y espacios extra
      const cleanQuery = query.trim().replace(/\s+/g, ' ').toLowerCase();
      
      this.logger.logProcess(`Consulta limpia: ${cleanQuery}`);
      
      // Validar que sea una consulta SELECT segura
      if (!cleanQuery.startsWith('select')) {
        this.logger.logSQL(`Consulta rechazada - no inicia con SELECT: ${cleanQuery.substring(0, 50)}...`);
        throw new Error('Solo se permiten consultas SELECT');
      }

      // Verificar que no contenga comandos peligrosos (pero permitir nombres de columnas)
      const dangerousPatterns = [
        /\bdrop\s+/i,
        /\bdelete\s+from\b/i,
        /\bupdate\s+/i,
        /\binsert\s+into\b/i,
        /\balter\s+/i,
        /\bcreate\s+/i,
        /\btruncate\s+/i
      ];
      
      for (const pattern of dangerousPatterns) {
        if (pattern.test(cleanQuery)) {
          this.logger.logSQL(`Comando peligroso detectado: ${pattern}`);
          throw new Error(`Comando no permitido detectado en la consulta`);
        }
      }

      this.logger.logProcess('Consulta validada como segura, ejecutando...');
      this.logger.logSQL(`Ejecutando consulta SQL: ${query}`);
      
      const result = await this.dataSource.query(query);
      
      this.logger.logSQL(`Consulta ejecutada exitosamente. Resultados: ${result.length} registros`);
      this.logger.logProcess(`Datos completos obtenidos: ${JSON.stringify(result, null, 2)}`);
      
      return result;
    } catch (error) {
      this.logger.logException('IntentService', 'executeSQL', error);
      throw error;
    }
  }

  /**
   * Guarda productos consultados en caché para referencia futura
   */
  private saveProductsToCache(phoneNumber: string, products: any[]) {
    const cleanPhone = this.cleanPhoneNumber(phoneNumber);
    const now = Date.now();
    
    // Limpiar caché expirado
    for (const [key, value] of this.productSearchCache.entries()) {
      if (now - value.timestamp > this.PRODUCT_SEARCH_TTL) {
        this.productSearchCache.delete(key);
      }
    }
    
    // Obtener productos existentes o crear array vacío
    const existing = this.productSearchCache.get(cleanPhone);
    let allProducts = existing ? [...existing.products] : [];
    
    // Agregar nuevos productos (evitar duplicados por ID)
    products.forEach(newProduct => {
      const existingIndex = allProducts.findIndex(p => p.id === newProduct.id);
      if (existingIndex === -1) {
        allProducts.push(newProduct);
      } else {
        // Actualizar producto existente
        allProducts[existingIndex] = newProduct;
      }
    });
    
    this.productSearchCache.set(cleanPhone, {
      products: allProducts,
      timestamp: now
    });
    
    this.logger.logProcess(`Productos guardados en caché para ${cleanPhone}: ${allProducts.length} productos totales`);
  }

  /**
   * Obtiene todos los productos consultados previamente por un usuario
   */
  private getProductsFromCache(phoneNumber: string): any[] {
    const cleanPhone = this.cleanPhoneNumber(phoneNumber);
    const cached = this.productSearchCache.get(cleanPhone);
    
    if (cached && (Date.now() - cached.timestamp) < this.PRODUCT_SEARCH_TTL) {
      this.logger.logProcess(`Productos recuperados del caché para ${cleanPhone}: ${cached.products.length} productos`);
      return cached.products;
    }
    
    this.logger.logProcess(`No hay productos en caché para ${cleanPhone} o han expirado`);
    return [];
  }

  /**
   * Obtiene información completa de un producto específico por ID
   */
  private async getCompleteProductInfo(productId: string) {
    try {
      this.logger.logProcess(`Obteniendo información completa para producto ID: ${productId}`);
      
      const query = `
        SELECT 
          p.id, p.name, p.description, p.short_description, p.price, p.stock,
          c.name as category_name, 
          b.name as brand_name,
          m.url as image_url,
          m.id as media_id
        FROM product p
        LEFT JOIN category c ON p.category_id = c.id
        LEFT JOIN brand b ON p.brand_id = b.id  
        LEFT JOIN (
            SELECT entity_id, url, id
            FROM media 
            WHERE entity_type = 'PRODUCT' 
              AND file_type = 'IMAGE' 
              AND status = 'ACTIVE'
            ORDER BY display_order ASC, id ASC
            LIMIT 1
        ) m ON p.id = m.entity_id
        WHERE p.id = ${productId} AND p.deleted_at IS NULL
        LIMIT 1
      `;
      
      this.logger.logSQL(`Consulta info completa: ${query}`);
      const result = await this.executeSQL(query);
      
      if (result && result.length > 0) {
        const product = result[0];
        this.logger.logProcess(`Info completa obtenida - Precio: ${product.price}, Stock: ${product.stock}, Imagen: ${product.image_url}`);
        
        return {
          description: product.description || product.short_description,
          price: parseFloat(product.price) || 0,
          stock: product.stock || 0,
          category: product.category_name,
          brand: product.brand_name,
          image_url: product.image_url
        };
      }
      
      this.logger.logProcess(`No se encontró información adicional para producto ID: ${productId}`);
      return {};
    } catch (error) {
      this.logger.logException('IntentService', 'getCompleteProductInfo', error);
      return {};
    }
  }

  /**
   * Busca información usando consultas SQL directas generadas por IA
   */
  private async searchWithDirectSQL(
    searchRequest: { type: string; query: string },
    messages: MessageData[],
    userInfo?: any
  ): Promise<any> {
    try {
      // Obtener texto de los mensajes
      const messageText = messages
        .filter(msg => msg.type === 'text' && msg.content)
        .map(msg => msg.content)
        .join(' ');
      
      let allProducts = [];
      let sqlQuery = '';

      // Si es una búsqueda de productos, usar la consulta estandarizada
      if (['product', 'category', 'brand'].includes(searchRequest.type)) {
        this.logger.logWhatsapp('Búsqueda de productos detectada. Usando consulta estándar...');
        sqlQuery = this.applySQLPermissions(GET_ALL_PRODUCTS_QUERY, userInfo);
        allProducts = await this.executeSQL(sqlQuery);
        this.logger.logProcess(`Consulta estándar ejecutada. Total productos/refacciones encontrados: ${allProducts.length}`);
      } else {
         // Para otras consultas (si las hubiera en el futuro), generar SQL con IA
         const dbStructure = await this.getDatabaseStructure();
         sqlQuery = await this.iaService.generateSQLQuery(messageText, searchRequest, dbStructure);
         sqlQuery = this.applySQLPermissions(sqlQuery, userInfo);
         allProducts = await this.executeSQL(sqlQuery);
      }
      
      let relevantProducts: any[] = [];
      const maxResults = this.getMaxResultsForUser(userInfo);
      
      // Si la consulta es específica, filtrar con la IA. Si es general, mostrar todo.
      if (searchRequest.query && searchRequest.query.trim() !== '') {
        this.logger.logProcess(`Filtrando ${allProducts.length} productos con la IA...`);
        relevantProducts = await this.iaService.filterRelevantProducts(
          searchRequest.query, 
          allProducts, 
          maxResults
        );
        this.logger.logProcess(`Productos filtrados por IA: ${relevantProducts.length} de ${allProducts.length} totales`);
      } else {
        this.logger.logProcess(`Consulta general. Mostrando los primeros ${maxResults} productos.`);
        relevantProducts = allProducts.slice(0, maxResults);
      }
        
      // Guardar los productos relevantes en caché para posible cotización futura
      this.saveProductsToCache(userInfo.phoneNumber, relevantProducts);
      
      return {
        type: 'database_results',
        query: searchRequest.query,
        sql_executed: sqlQuery, // Mantenemos la consulta ejecutada para logging
        data: relevantProducts,
        total: relevantProducts.length,
        total_before_filter: allProducts.length,
        user_role: userInfo?.role || 'no_registrado'
      };

    } catch (error) {
      this.logger.logException('IntentService', 'searchWithDirectSQL', error);
      return { 
        error: 'Error ejecutando búsqueda en base de datos',
        details: error.message 
      };
    }
  }

  /**
   * Busca información usando consultas SQL directas con contexto
   */
  private async searchWithDirectSQLAndContext(
    searchRequest: { type: string; query: string },
    messages: MessageData[],
    context: { summary: string; recentMessages: any[] },
    userInfo?: any
  ): Promise<any> {
    try {
      // Obtener texto de los mensajes
      const messageText = messages
        .filter(msg => msg.type === 'text' && msg.content)
        .map(msg => msg.content)
        .join(' ');
        
      let allProducts = [];
      let sqlQuery = '';

      // Si es una búsqueda de productos, usar la consulta estandarizada
      if (['product', 'category', 'brand'].includes(searchRequest.type)) {
        this.logger.logWhatsapp('Búsqueda de productos con contexto detectada. Usando consulta estándar...');
        sqlQuery = this.applySQLPermissions(GET_ALL_PRODUCTS_QUERY, userInfo);
        allProducts = await this.executeSQL(sqlQuery);
        this.logger.logProcess(`Consulta estándar ejecutada. Total productos/refacciones encontrados: ${allProducts.length}`);
      } else {
         // Para otras consultas (si las hubiera en el futuro), generar SQL con IA y contexto
         const dbStructure = await this.getDatabaseStructure();
         sqlQuery = await this.iaService.generateSQLQueryWithContext(messageText, searchRequest, context, dbStructure);
         sqlQuery = this.applySQLPermissions(sqlQuery, userInfo);
         allProducts = await this.executeSQL(sqlQuery);
      }
      
      let relevantProducts: any[] = [];
      const maxResults = this.getMaxResultsForUser(userInfo);

      // Si la consulta es específica, filtrar con la IA. Si es general, mostrar todo.
      if (searchRequest.query && searchRequest.query.trim() !== '') {
        this.logger.logProcess(`Filtrando ${allProducts.length} productos con la IA (con contexto)...`);
        relevantProducts = await this.iaService.filterRelevantProducts(
          searchRequest.query, 
          allProducts, 
          maxResults
        );
        this.logger.logProcess(`Productos filtrados por IA con contexto: ${relevantProducts.length} de ${allProducts.length} totales`);
      } else {
        this.logger.logProcess(`Consulta general. Mostrando los primeros ${maxResults} productos.`);
        relevantProducts = allProducts.slice(0, maxResults);
      }

      // Guardar los productos relevantes en caché para posible cotización futura
      this.saveProductsToCache(userInfo.phoneNumber, relevantProducts);

      return {
        type: 'database_results_with_context',
        query: searchRequest.query,
        context_summary: context.summary,
        sql_executed: sqlQuery,
        data: relevantProducts,
        total: relevantProducts.length,
        total_before_filter: allProducts.length,
        user_role: userInfo?.role || 'no_registrado'
      };

    } catch (error) {
      this.logger.logException('IntentService', 'searchWithDirectSQLAndContext', error);
      return { 
        error: 'Error ejecutando búsqueda en base de datos con contexto',
        details: error.message 
      };
    }
  }

  /**
   * Analiza si el usuario solicita un reporte o cotización
   */
  private async analyzeIfNeedsReport(messages: MessageData[]): Promise<{
    needs: boolean;
    type: 'sales_report' | 'order_report' | 'custom_report' | 'quotation' | 'none';
    params?: any;
  }> {
    try {
      const messageText = messages
        .filter(msg => msg.type === 'text' && msg.content)
        .map(msg => msg.content)
        .join(' ');

      return await this.iaService.analyzeReportNeeds(messageText);
    } catch (error) {
      this.logger.logException('IntentService', 'analyzeIfNeedsReport', error);
      return { needs: false, type: 'none' };
    }
  }

  /**
   * Maneja la solicitud de reportes y cotizaciones
   */
  private async handleReportRequest(
    reportRequest: { needs: boolean; type: string; params?: any },
    phoneNumber: string,
    userInfo: any
  ): Promise<string> {
    try {
      // Verificar permisos del usuario para reportes
      if ((reportRequest.type === 'sales_report' || reportRequest.type === 'order_report' || reportRequest.type === 'custom_report') &&
          (!userInfo?.isRegistered || !this.hasReportPermissions(userInfo))) {
        return 'Lo siento, no tienes permisos para generar reportes. Contacta al administrador.';
      }

      // Las cotizaciones solo requieren permisos para datos sensibles (precios)
      if (reportRequest.type === 'quotation' && !this.hasSensitiveDataPermissions(userInfo)) {
        return 'Lo siento, necesitas permisos especiales para generar cotizaciones. Contacta al administrador.';
      }

      this.logger.logWhatsapp(`Generando reporte de tipo: ${reportRequest.type}`);

      switch (reportRequest.type) {
        case 'sales_report':
          return await this.generateSalesReport(reportRequest.params, phoneNumber);
        
        case 'order_report':
          return await this.generateOrderReport(reportRequest.params, phoneNumber);
        
        case 'custom_report':
          return await this.generateCustomReport(reportRequest.params, phoneNumber);
        
        case 'quotation':
          return await this.generateQuotation(reportRequest.params, phoneNumber, userInfo);
        
        default:
          return 'No pude identificar qué tipo de reporte o cotización necesitas. ¿Podrías ser más específico?';
      }
    } catch (error) {
      this.logger.logException('IntentService', 'handleReportRequest', error);
      return 'Hubo un error al generar el reporte. Por favor, intenta nuevamente.';
    }
  }

  /**
   * Verifica si el usuario tiene permisos para generar reportes
   */
  private hasReportPermissions(userInfo: any): boolean {
    if (!userInfo?.role) return false;
    
    // Solo ADMIN y MANAGER pueden generar reportes
    return userInfo.role === stringConstants.ADMIN || 
           userInfo.role === stringConstants.MANAGER;
  }

  /**
   * Verifica si el usuario puede consultar información de productos
   */
  private hasProductQueryPermissions(userInfo: any): boolean {
    if (!userInfo?.isRegistered) {
      // Usuarios no registrados pueden ver productos básicos
      return true;
    }
    
    // Todos los usuarios registrados pueden consultar productos
    return userInfo.role === stringConstants.ADMIN || 
           userInfo.role === stringConstants.MANAGER ||
           userInfo.role === stringConstants.FREQUENT_CUSTOMER ||
           userInfo.role === stringConstants.GENERAL_CUSTOMER;
  }

  /**
   * Verifica si el usuario puede consultar información sensible (precios, stock detallado)
   */
  private hasSensitiveDataPermissions(userInfo: any): boolean {
    if (!userInfo?.isRegistered) {
      // Usuarios no registrados no pueden ver información sensible
      return false;
    }
    
    // Solo ADMIN, MANAGER y FREQUENT_CUSTOMER pueden ver información sensible
    return userInfo.role === stringConstants.ADMIN || 
           userInfo.role === stringConstants.MANAGER ||
           userInfo.role === stringConstants.FREQUENT_CUSTOMER;
  }

  /**
   * Obtiene el número máximo de resultados basado en el rol del usuario
   */
  private getMaxResultsForUser(userInfo: any): number {
    if (!userInfo?.isRegistered) {
      return 5; // Usuarios no registrados: máximo 5 resultados
    }

    switch (userInfo.role) {
      case stringConstants.ADMIN:
      case stringConstants.MANAGER:
        return 20; // Admin y Manager: máximo 20 resultados
      case stringConstants.FREQUENT_CUSTOMER:
        return 15; // Cliente frecuente: máximo 15 resultados
      case stringConstants.GENERAL_CUSTOMER:
        return 10; // Cliente general: máximo 10 resultados
      default:
        return 5; // Default: máximo 5 resultados
    }
  }

  /**
   * Filtra la consulta SQL basada en los permisos del usuario
   */
  private applySQLPermissions(sqlQuery: string, userInfo: any): string {
    // Si es ADMIN, puede consultar todo sin restricciones
    if (userInfo?.role === stringConstants.ADMIN) {
      this.logger.logWhatsapp(`Usuario ADMIN - Sin restricciones SQL`);
      return sqlQuery;
    }

    // Si es MANAGER, puede consultar todo pero con algunas limitaciones
    if (userInfo?.role === stringConstants.MANAGER) {
      this.logger.logWhatsapp(`Usuario MANAGER - Acceso completo`);
      return sqlQuery;
    }

    // Si es FREQUENT_CUSTOMER, puede ver información completa
    if (userInfo?.role === stringConstants.FREQUENT_CUSTOMER) {
      this.logger.logWhatsapp(`Usuario FREQUENT_CUSTOMER - Acceso completo a productos`);
      return sqlQuery;
    }

    // Si es GENERAL_CUSTOMER, puede ver información básica (sin stock detallado)
    if (userInfo?.role === stringConstants.GENERAL_CUSTOMER) {
      this.logger.logWhatsapp(`Usuario GENERAL_CUSTOMER - Acceso limitado`);
      // Remover campos sensibles como stock exacto de productos y refacciones
      let filteredQuery = sqlQuery.replace(/\w+\.stock\s*,?\s*/gi, '');
      // Agregar límite más restrictivo
      filteredQuery = filteredQuery.replace(/ORDER BY name ASC;/gi, 'ORDER BY name ASC LIMIT 10;');
      return filteredQuery;
    }

    // Usuario no registrado - solo información básica pública
    this.logger.logWhatsapp(`Usuario no registrado - Solo información pública`);
    let publicQuery = sqlQuery.replace(/\w+\.stock\s*,?\s*/gi, '');
    publicQuery = publicQuery.replace(/\w+\.price\s*,?\s*/gi, '');
    publicQuery = publicQuery.replace(/0 as price\s*,?\s*/gi, '');
    publicQuery = publicQuery.replace(/ORDER BY name ASC;/gi, 'ORDER BY name ASC LIMIT 5;');
    return publicQuery;
  }

     /**
    * Genera reporte de ventas
    */
   private async generateSalesReport(params: any, phoneNumber: string): Promise<string> {
     try {
       // Definir fechas por defecto (hoy)
       const today = new Date();
       const startDate = params?.startDate ? new Date(params.startDate) : new Date(today.getFullYear(), today.getMonth(), today.getDate());
       const endDate = params?.endDate ? new Date(params.endDate) : new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

       // Usar el nuevo método que envía directamente por WhatsApp
       const result = await this.reportService.generateAndSendSalesReport(startDate, endDate, phoneNumber);

       if (result?.success) {
         return `✅ Reporte de ventas generado y enviado. Total: ${result.data?.totalOrders || 0} órdenes, Ventas: $${result.data?.totalSales?.toFixed(2) || '0.00'}`;
       } else {
         return `❌ Error al generar el reporte: ${result?.error || 'Error desconocido'}`;
       }
     } catch (error) {
       this.logger.logException('IntentService', 'generateSalesReport', error);
       return 'Error interno al generar el reporte de ventas.';
     }
   }

  /**
   * Genera reporte de orden específica
   */
  private async generateOrderReport(params: any, phoneNumber: string): Promise<string> {
    try {
      if (!params?.orderId) {
        return 'Necesito el ID de la orden para generar el reporte. Por ejemplo: "reporte de orden 123"';
      }

             const result = await this.reportService.generateAndSendOrderReport(params.orderId);

       if (result?.success) {
         return `✅ Reporte de la orden #${params.orderId} generado y enviado exitosamente.`;
       } else {
         return `❌ Error al generar el reporte de la orden.`;
       }
    } catch (error) {
      this.logger.logException('IntentService', 'generateOrderReport', error);
      return 'Error interno al generar el reporte de orden.';
    }
  }

     /**
    * Genera reporte personalizado basado en consulta SQL
    */
   private async generateCustomReport(params: any, phoneNumber: string): Promise<string> {
     try {
       // Usar IA para generar consulta SQL para el reporte
       const dbStructure = await this.getDatabaseStructure();
       const reportQuery = await this.iaService.generateReportQuery(params.description || params.query, dbStructure);

       if (!reportQuery) {
         return 'No pude generar la consulta para tu reporte personalizado. ¿Podrías especificar más detalles?';
       }

       // Ejecutar consulta
       const results = await this.executeSQL(reportQuery);
       
       if (!results || results.length === 0) {
         return 'No se encontraron datos para el reporte solicitado.';
       }

       // Generar y enviar reporte personalizado
       const reportTitle = `Reporte Personalizado: ${params.description || 'Consulta SQL'}`;
       const result = await this.reportService.generateAndSendCustomReport(results, reportTitle, phoneNumber);
       
       if (result?.success) {
         return `✅ Reporte personalizado generado y enviado. Total: ${result.data?.totalRecords || 0} registros encontrados.`;
       } else {
         return `❌ Error al generar el reporte: ${result?.error || 'Error desconocido'}`;
       }
     } catch (error) {
       this.logger.logException('IntentService', 'generateCustomReport', error);
       return 'Error al generar el reporte personalizado.';
     }
   }

   /**
    * Genera cotización basada en productos seleccionados o búsqueda
    */
   private async generateQuotation(params: any, phoneNumber: string, userInfo: any): Promise<string> {
     try {
       this.logger.logProcess('=== INICIO GENERATEQUOTATION (NUEVO FLUJO) ===');
       this.logger.logProcess(`Parámetros de IA: ${JSON.stringify(params, null, 2)}`);
       
       // Unir todos los detalles en una sola consulta de texto para la IA
       const userQuery = [
           ...(params.products || []),
           params.brand,
           ...(params.specifications || [])
       ].filter(Boolean).join(' ');

       this.logger.logProcess(`Consulta de usuario para cotización: "${userQuery}"`);

       if (!userQuery) {
           return "Para generar la cotización, necesito que me digas qué productos te interesan. 😊";
       }

       // 1. Obtener TODOS los productos de la base de datos
       this.logger.logWhatsapp('Obteniendo lista completa de productos para cotización...');
       const allProductsQuery = this.applySQLPermissions(GET_ALL_PRODUCTS_QUERY, userInfo);
       const allProducts = await this.executeSQL(allProductsQuery);
       this.logger.logProcess(`Total productos/refacciones encontrados: ${allProducts.length}`);

       if (allProducts.length === 0) {
           return 'Lo siento, no pude acceder a la lista de productos en este momento. Por favor, intenta de nuevo más tarde.';
       }

       // 2. Usar la IA para filtrar los productos relevantes
       this.logger.logProcess(`Filtrando productos relevantes con IA para la cotización...`);
       const relevantProducts = await this.iaService.filterRelevantProducts(
           userQuery,
           allProducts,
           10 // Máximo 10 productos para una cotización
       );

       this.logger.logProcess(`Productos filtrados por IA para cotización: ${relevantProducts.length}`);

       let productsForQuotation: any[] = [];
       if (relevantProducts && relevantProducts.length > 0) {
           productsForQuotation = relevantProducts.map(p => ({ ...p, quantity: 1 }));
       }

       // Si la IA no encontró productos pero el usuario pidió algo, crear un producto temporal
       if (productsForQuotation.length === 0 && userQuery) {
         this.logger.logProcess('IA no encontró productos específicos. Creando cotización con producto temporal.');
         productsForQuotation = [{
           id: 'temp-0',
           name: userQuery,
           description: 'Producto solicitado - Un asesor confirmará disponibilidad y precio final.',
           price: 0,
           quantity: 1,
           stock: 0,
         }];
       }

       if (productsForQuotation.length === 0) {
         return 'No pude identificar los productos para tu cotización. ¿Podrías ser más específico?';
       }

       // Preparar información del cliente para el PDF
       const customerInfo = userInfo?.isRegistered ? {
         name: `${userInfo.name} ${userInfo.lastName || ''}`.trim(),
         phone: userInfo.phoneNumber,
         email: userInfo.email || '',
         role: userInfo.role
       } : { name: 'Cliente', phone: this.cleanPhoneNumber(phoneNumber) };
       
       this.logger.logProcess('Generando buffer de cotización...');
       const quotationResult = await this.reportService.generateQuotation(productsForQuotation, 'pdf', customerInfo);

       if (!quotationResult.success || !quotationResult.data) {
         this.logger.logException('IntentService', 'generateQuotation', quotationResult.error || 'No se pudo generar el buffer del PDF.');
         return `Lo siento, hubo un problema al generar tu cotización. Error: ${quotationResult.error}`;
       }
       
       this.logger.logProcess('Enviando documento de cotización por WhatsApp...');
       const fileName = `cotizacion_${Date.now()}.pdf`;
       await this.whatsappService.sendDocument(phoneNumber, quotationResult.data, fileName, 'Aquí tienes tu cotización.');
       
       this.saveProductsToCache(phoneNumber, productsForQuotation);

       // Generar la respuesta de texto personalizada y amigable
       const total = productsForQuotation.reduce((sum, p) => sum + (parseFloat(p.price || 0) * p.quantity), 0) * 1.16;
       const friendlyName = userInfo?.isRegistered ? userInfo.name : 'qué tal';
       
       let responseMessage = `¡Hola ${friendlyName}! 😊 Te he enviado la cotización que solicitaste en un archivo PDF.`;
       if (productsForQuotation[0].price === 0) {
         responseMessage += `\n\nHe incluido "${productsForQuotation[0].name}" con precio a consultar. Un asesor se pondrá en contacto contigo para darte el precio final y la disponibilidad.`;
       } else {
         responseMessage += `\nEl total es de $${total.toFixed(2)} (IVA incluido). Por favor, revísala y dime si tienes alguna pregunta.`;
       }
       responseMessage += `\n\n¿Hay algo más en lo que pueda ayudarte? ✨`;

       return responseMessage;

     } catch (error) {
       this.logger.logException('IntentService', 'generateQuotation', error);
       return 'Error interno al generar la cotización.';
     }
   }
} 