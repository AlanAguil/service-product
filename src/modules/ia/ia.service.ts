import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CustomLoggerService } from '../../common/logger/logger.service';

export interface MessageData {
    messageNumber: number;
    type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'other';
    content?: string;
    caption?: string;
    fileName?: string;
    imageBuffer?: Buffer;  // Para enviar la imagen real a Gemini
    audioBuffer?: Buffer; // Para el audio a transcribir
}

export interface ComprehensiveIntent {
  intent: 'product_query' | 'quotation_request' | 'report_request' | 'general_question' | 'greeting' | 'other';
  entities: {
    query?: string | null;
    products?: string[];
    brand?: string;
    specifications?: string[];
    report_type?: 'sales' | 'order' | 'custom';
    report_params?: { orderId?: string; description?: string };
  };
  suggested_response: string;
}

@Injectable()
export class IaService {
    private genAI: GoogleGenerativeAI;
    private model: any; // You can type it better if desired, but 'any' is sufficient for now

    private readonly REPORT_ANALYSIS_INSTRUCTIONS = `
INSTRUCCIONES CRÍTICAS: Tu única tarea es decidir si el usuario pide EXPLÍCITAMENTE una cotización o un reporte. NO debes inferir ni adivinar.

REGLA DE ORO:
- Si el mensaje del cliente NO CONTIENE una de las palabras clave exactas, la respuesta DEBE SER {"needs": false, "type": "none"}.
- PALABRAS CLAVE PARA COTIZACIÓN: "cotización", "cotízame", "presupuesto", "cotizar".
- PALABRAS CLAVE PARA REPORTE: "reporte", "genera un reporte", "estadísticas".

NO ES UNA COTIZACIÓN (deben ser "none"):
- "¿tienen amoladoras?" -> {"needs": false, "type": "none"}
- "busco una revolvedora" -> {"needs": false, "type": "none"}
- "precio de la revolvedora cipsa" -> {"needs": false, "type": "none"}
- "información sobre taladros" -> {"needs": false, "type": "none"}
- "¿cuánto cuesta?" -> {"needs": false, "type": "none"}

SÍ ES UNA COTIZACIÓN:
- "quiero una cotización de amoladoras" -> {"needs": true, "type": "quotation", "params": {"products": ["amoladoras"]}}
- "cotízame una revolvedora por favor" -> {"needs": true, "type": "quotation", "params": {"products": ["revolvedora"]}}

PARA COTIZACIONES (SOLO si se usan las palabras clave):
- Extrae la MAYOR CANTIDAD de detalles del mensaje (marca, modelo, etc.).
- "products": Usa el término general del producto.
- "brand": Extrae la MARCA si se menciona.
- "specifications": Extrae CUALQUIER otro detalle.
- NO INVENTES detalles que el cliente no mencionó.

Responde SOLO en formato JSON válido, sin markdown, con la siguiente estructura:
{
    "needs": true/false,
    "type": "sales_report|order_report|quotation|custom_report|none",
    "params": {
        "orderId": "123" (opcional),
        "products": ["producto"],
        "brand": "marca" (opcional),
        "specifications": ["detalle"] (opcional),
        "format": "pdf" (default),
        "description": "descripción"
    }
}
`;

    private readonly COMPREHENSIVE_INTENT_ANALYSIS_INSTRUCTIONS = `
INSTRUCCIONES CRÍTICAS: Tu tarea es analizar el mensaje del cliente y el contexto de la conversación para clasificar su intención y extraer la información relevante en un solo paso. Responde ÚNICAMENTE con un objeto JSON válido sin markdown.

ESTRUCTURA DE RESPUESTA JSON:
{
  "intent": "product_query" | "quotation_request" | "report_request" | "general_question" | "greeting" | "other",
  "entities": {
    "query": "término de búsqueda o pregunta del cliente",
    "products": ["producto1", "producto2"],
    "brand": "marca",
    "specifications": ["detalle1"],
    "report_type": "sales" | "order" | "custom",
    "report_params": { "orderId": "123", "description": "descripción" }
  },
  "suggested_response": "Una respuesta amigable y corta para el cliente, como si fueras un asistente."
}

REGLAS DE CLASIFICACIÓN DE INTENCIÓN:
1.  "quotation_request": Usa esta intención SOLAMENTE si el cliente usa las palabras clave exactas: "cotización", "cotízame", "presupuesto", "cotizar".
    - Extrae productos, marca y especificaciones a "entities".
2.  "report_request": Usa esta intención SOLAMENTE si el cliente usa las palabras clave: "reporte", "genera un reporte", "estadísticas".
    - Extrae el tipo de reporte y los parámetros.
3.  "product_query": Usa esta intención si el cliente muestra interés en productos. Esto incluye preguntas generales como "¿qué vendes?" o "¿tienes refacciones?", así como preguntas específicas por productos, precios, stock, disponibilidad o características. NO uses esta intención si se usan las palabras de cotización.
    - Extrae la consulta específica a "entities.query". Si la pregunta es muy general (ej: "tienes productos", "¿qué vendes?"), deja el campo "query" como null.
4.  "general_question": Preguntas que no son sobre productos ni reportes (ej: "¿cuál es su horario?").
    - Extrae la pregunta a "entities.query".
5.  "greeting": Saludos simples (ej: "hola", "buen día").
6.  "other": Si no encaja en ninguna de las anteriores.

REGLAS PARA "suggested_response":
-   Debe ser CORTA, AMIGABLE y PROACTIVA (como un vendedor).
-   Debe ser variada, no uses siempre las mismas frases.
-   Usa emojis para dar calidez.

EJEMPLOS:
- Cliente: "Hola, buen día" -> {"intent": "greeting", "entities": {}, "suggested_response": "¡Hola! ¿En qué puedo ayudarte hoy? 😊"}
- Cliente: "busco una revolvedora cipsa" -> {"intent": "product_query", "entities": {"query": "revolvedora cipsa"}, "suggested_response": "¡Claro! Déjame revisar la disponibilidad de las revolvedoras Cipsa. Un momento por favor... ⚙️"}
- Cliente: "¿qué productos manejas?" -> {"intent": "product_query", "entities": {"query": null}, "suggested_response": "¡Claro! Manejamos una amplia gama de productos y refacciones. ¿Buscas algo en especial o te gustaría conocer nuestras categorías principales? 🔩"}
- Cliente: "cotízame una amoladora y un taladro" -> {"intent": "quotation_request", "entities": {"products": ["amoladora", "taladro"]}, "suggested_response": "¡Perfecto! Preparando tu cotización. Te la enviaré en un momento. 📄"}
- Cliente: "genera el reporte de ventas de hoy" -> {"intent": "report_request", "entities": {"report_type": "sales", "report_params": {"description": "ventas de hoy"}}, "suggested_response": "Entendido. Generando el reporte de ventas de hoy. 📊"}
`;

    // Constante con instrucciones SQL precisas
    private readonly SQL_INSTRUCTIONS = `
INSTRUCCIONES CRÍTICAS PARA GENERAR SQL:

1. SOLO generar consultas SELECT
2. NUNCA usar comandos: DROP, DELETE FROM, UPDATE, INSERT INTO, ALTER, CREATE, TRUNCATE
3. Para verificar registros activos usar: WHERE deleted_at IS NULL
4. Para productos activos usar: WHERE status = 'ACTIVE'

IMPORTANTE: Para búsquedas de PRODUCTOS, NO buscar términos específicos.
En su lugar, traer TODOS los productos y refacciones con solo información básica:

PARA BÚSQUEDAS DE PRODUCTOS:
SELECT p.id, p.name, COALESCE(p.description, p.short_description, '') as description
FROM product p
WHERE p.deleted_at IS NULL
UNION ALL
SELECT sp.id, sp.name, COALESCE(sp.description, sp.short_description, '') as description  
FROM spare_part sp
WHERE sp.deleted_at IS NULL
ORDER BY name ASC;

La IA evaluará después cuáles productos son relevantes para la consulta del usuario.

Para otras consultas específicas (no búsqueda de productos):
5. SIEMPRE usar JOINs cuando necesites datos relacionados:
   - Product + Category: JOIN category c ON p.category_id = c.id
   - Product + Brand: JOIN brand b ON p.brand_id = b.id
   - Order + User: JOIN user u ON o.user_id = u.id
6. Campos adicionales cuando sea necesario:
   - p.price, p.stock, c.name as category_name, b.name as brand_name
7. SIEMPRE limitar resultados: LIMIT 15 (excepto para búsqueda inicial de productos)
8. Responder SOLO con la consulta SQL, sin explicaciones ni markdown

EJEMPLO PARA BÚSQUEDA DE PRODUCTOS:
SELECT p.id, p.name, COALESCE(p.description, p.short_description, '') as description
FROM product p WHERE p.deleted_at IS NULL
UNION ALL  
SELECT sp.id, sp.name, COALESCE(sp.description, sp.short_description, '') as description
FROM spare_part sp WHERE sp.deleted_at IS NULL
ORDER BY name ASC;
`;

    constructor(private readonly logger: CustomLoggerService) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new InternalServerErrorException('GEMINI_API_KEY no está configurada en las variables de entorno.');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);

        // You can choose the model that best fits your needs. 'gemini-1.5-flash' is faster and more economical.
        // 'gemini-1.5-pro' is more powerful for complex prompts.
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }

    /**
     * Generates a product description using the Gemini API.
     * @param product The product name and/or code, and possibly some key features.
     * @returns The generated description as a text string.
     */
    async generateProductDescription(product: string) {
        // This is the key "prompt". You can make it as specific as needed.
        // The more information you give to Gemini, the better the description will be.
        const prompt = `Genera una descripción detallada y atractiva para un producto de eCommerce.
        El producto se describe como: "${product}".
        La descripción debe ser persuasiva, destacar los beneficios clave para el usuario,
        tener al menos 3 párrafos y usar un lenguaje de ventas profesional.
        Evita la redundancia y sé conciso donde sea posible.`;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const responseText = response.text();
            this.logger.logIA(`Descripción de producto generada: ${responseText.substring(0, 100)}...`);
            return responseText;
        } catch (error) {
            this.logger.logException('IaService', 'generateProductDescription', error);
            // Here you can handle the error more specifically or throw a custom exception
            throw new InternalServerErrorException('Error communicating with the AI service to generate the description.');
        }
    }

    /**
     * Detects client intent based on WhatsApp messages.
     * @param messages Array of messages from the client
     * @returns AI response analyzing the client's intent and providing appropriate assistance
     */
    async detectClientIntent(messages: MessageData[]): Promise<string> {
        try {
            // Construir el contenido para Gemini con soporte para imágenes
            const contents: any[] = [];

            // Agregar texto contextual inicial
            let textContent = 'El cliente me ha enviado los siguientes mensajes por WhatsApp:\n\n';

            // Procesar cada mensaje
            for (const msg of messages) {
                textContent += `${msg.messageNumber}. `;

                switch (msg.type) {
                    case 'text':
                        textContent += `Texto: "${msg.content}"\n`;
                        break;
                    case 'image':
                        if (msg.imageBuffer) {
                            textContent += `Imagen${msg.caption ? ` con texto: "${msg.caption}"` : ''} (analizar imagen adjunta)\n`;
                            // Agregar la imagen al contenido
                            contents.push({
                                inlineData: {
                                    data: msg.imageBuffer.toString('base64'),
                                    mimeType: 'image/jpeg'
                                }
                            });
                        } else {
                            textContent += `Imagen${msg.caption ? ` con texto: "${msg.caption}"` : ''}\n`;
                        }
                        break;
                    case 'document':
                        textContent += `Documento: ${msg.fileName || 'archivo'}\n`;
                        break;
                    case 'audio':
                        textContent += `Audio\n`;
                        break;
                    case 'video':
                        textContent += `Video\n`;
                        break;
                    default:
                        textContent += `Mensaje de tipo no identificado\n`;
                }
            }

            // Agregar el prompt principal
            textContent += `

Eres un asistente virtual de atención al cliente profesional y amigable. 

INSTRUCCIONES IMPORTANTES:
- Responde de forma CONCISA pero MUY AMABLE y cálida
- NO uses saludos repetitivos como "Hola" a menos que sea la primera interacción
- NUNCA repitas las mismas frases de inicio - VARÍA tu forma de empezar cada respuesta
- Máximo 2-3 oraciones por respuesta
- Mantén un tono cálido, servicial y cercano (como un amigo que ayuda)
- Usa emojis apropiados para dar calidez (😊, 👍, ✨, etc.)
- Si NO conoces el nombre del cliente, pregúntalo de manera natural en tu respuesta

Analiza los mensajes y las imágenes del cliente:

1. Si hay imágenes, analízalas detalladamente y describe lo que ves
2. Identifica qué necesita o qué problema tiene el cliente
3. Proporciona una respuesta útil y profesional
4. Si es una consulta de productos/servicios, ofrece información relevante
5. Si es una queja o problema, muestra empatía y ofrece soluciones
6. Si es un saludo simple, responde amigablemente y pregunta cómo puedes ayudar

EJEMPLOS DE VARIEDAD EN RESPUESTAS:
- Varía el inicio: "Perfecto 👍", "Excelente pregunta 😊", "Te explico ✨", "Muy buena elección 🔧", "Exacto 💡", "Entendido 👌"
- NUNCA uses la misma frase de inicio dos veces seguidas

Responde de manera amable, servicial y útil al cliente. Usa emojis cuando sea apropiado para darle calidez.`;

            // Preparar el contenido final para Gemini
            const finalContents = [
                { text: textContent },
                ...contents
            ];

            this.logger.logIA(`\n\n==================== PROMPT PARA IA ====================\n${textContent}\n======================================================\n\n`);

            const result = await this.model.generateContent(finalContents);
            const response = await result.response;
            const responseText = response.text();
            this.logger.logIA(`Respuesta de IA (intención sin contexto): ${responseText}`);
            return responseText;
        } catch (error) {
            this.logger.logException('IaService', 'detectClientIntent', error);
            throw new InternalServerErrorException('Error comunicándose con el servicio de IA para detectar la intención del cliente.');
        }
    }

    /**
     * Detects client intent with chat history context.
     * @param messages Array of current messages from the client
     * @param context Chat history context with summary and recent messages
     * @returns AI response with historical context
     */
    async detectClientIntentWithContext(
        messages: MessageData[],
        context: { summary: string; recentMessages: any[] }
    ): Promise<string> {
        try {
            // Construir el contenido con contexto histórico
            const contents: any[] = [];

            let textContent = '';

            // Agregar contexto histórico si existe
            if (context.summary) {
                textContent += `RESUMEN DE CONVERSACIÓN PREVIA: ${context.summary}\n\n`;
            }

            if (context.recentMessages && context.recentMessages.length > 0) {
                textContent += 'MENSAJES RECIENTES:\n';
                context.recentMessages.forEach((msg: any) => {
                    textContent += `${msg.role === 'user' ? 'Cliente' : 'Asistente'}: ${msg.content}\n`;
                });
                textContent += '\n';
            }

            textContent += 'NUEVOS MENSAJES DEL CLIENTE:\n\n';

            // Procesar mensajes actuales
            for (const msg of messages) {
                textContent += `${msg.messageNumber}. `;

                switch (msg.type) {
                    case 'text':
                        textContent += `Texto: "${msg.content}"\n`;
                        break;
                    case 'image':
                        if (msg.imageBuffer) {
                            textContent += `Imagen${msg.caption ? ` con texto: "${msg.caption}"` : ''} (analizar imagen adjunta)\n`;
                            contents.push({
                                inlineData: {
                                    data: msg.imageBuffer.toString('base64'),
                                    mimeType: 'image/jpeg'
                                }
                            });
                        } else {
                            textContent += `Imagen${msg.caption ? ` con texto: "${msg.caption}"` : ''}\n`;
                        }
                        break;
                    case 'document':
                        textContent += `Documento: ${msg.fileName || 'archivo'}\n`;
                        break;
                    case 'audio':
                        textContent += `Audio\n`;
                        break;
                    case 'video':
                        textContent += `Video\n`;
                        break;
                    default:
                        textContent += `Mensaje de tipo no identificado\n`;
                }
            }

            textContent += `

                Eres un asistente virtual de atención al cliente profesional y amigable.

                INSTRUCCIONES CRÍTICAS:
                - NUNCA repitas saludos como "Hola" ya que es una conversación CONTINUA
                - NUNCA repitas las mismas frases de inicio como "¡Claro que sí!" - VARÍA tu forma de responder
                - Responde de forma CONCISA pero MUY AMABLE y cálida (máximo 2-3 oraciones)
                - Mantén un tono cálido, servicial y cercano (como un amigo que ayuda)
                - Usa emojis apropiados para dar calidez (😊, 👍, ✨, etc.)
                - Usa el contexto previo para dar continuidad
                - Si NO conoces el nombre del cliente, pregúntalo de manera natural

                Analiza los mensajes y el historial del cliente:

                1. Si hay imágenes, analízalas detalladamente
                2. Considera el contexto de la conversación previa
                3. Mantén continuidad en el tono y tema de conversación
                4. Proporciona respuestas relevantes al contexto histórico
                5. Si es un seguimiento de algo previo, refiérete a ello directamente
                6. NO uses frases de relleno o saludos innecesarios

                EJEMPLOS DE VARIEDAD EN RESPUESTAS:
                - En lugar de repetir "¡Claro que sí!" usa: "Perfecto 👍", "Excelente pregunta 😊", "Te explico ✨", "Muy buena elección 🔧", "Exacto 💡"
                - Varía el inicio de CADA respuesta para sonar natural y no repetitivo

                Responde de manera contextual, amable y servicial al cliente. Usa emojis cuando sea apropiado para darle calidez.`;

            const finalContents = [
                { text: textContent },
                ...contents
            ];

            this.logger.logIA(`\n\n==================== PROMPT PARA IA ====================\n${textContent}\n======================================================\n\n`);

            const result = await this.model.generateContent(finalContents);
            const response = await result.response;
            const responseText = response.text();
            this.logger.logIA(`Respuesta de IA (intención con contexto): ${responseText}`);
            return responseText;
        } catch (error) {
            this.logger.logException('IaService', 'detectClientIntentWithContext', error);
            throw new InternalServerErrorException('Error comunicándose con el servicio de IA para detectar la intención del cliente con contexto.');
        }
    }

    /**
     * Creates a summary of conversation history.
     * @param messages Array of recent messages to summarize
     * @returns Condensed summary of the conversation
     */
    async createConversationSummary(messages: any[]): Promise<string> {
        try {
            let conversationText = 'Historial de conversación a resumir:\n\n';

            messages.forEach((msg: any, index: number) => {
                const role = msg.role === 'user' ? 'Cliente' : 'Asistente';
                conversationText += `${index + 1}. ${role}: ${msg.content}\n`;
            });

            const prompt = `${conversationText}

Crea un resumen CONCISO (máximo 2 oraciones) de esta conversación que capture:
1. El tema principal o necesidad del cliente
2. El estado actual de la consulta o problema
3. Información clave para continuar la conversación

El resumen debe ser útil para mantener contexto en futuras interacciones.
Responde solo el resumen, sin explicaciones adicionales.`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const responseText = response.text();
            this.logger.logIA(`Resumen de conversación generado: ${responseText}`);
            return responseText;
        } catch (error) {
            this.logger.logException('IaService', 'createConversationSummary', error);
            throw new InternalServerErrorException('Error creando resumen de conversación.');
        }
    }

    /**
     * Analyzes if the user's message requires product information.
     * @param messageText The user's message text
     * @returns Analysis result indicating if product info is needed
     */
    async analyzeProductInformationNeeds(messageText: string): Promise<{
        needs: boolean;
        type: 'product' | 'category' | 'brand' | 'general';
        query: string;
    }> {
        try {
            const prompt = `Analiza este mensaje del cliente: "${messageText}"

Determina si el cliente está pidiendo información específica sobre:
- PRODUCTOS (repuestos, partes específicas, inventario, precios, características)
- CATEGORÍAS (tipos de productos, grupos de repuestos)
- MARCAS (fabricantes específicos, productos de una marca)
- GENERAL (saludos, consultas generales no relacionadas con productos)

Responde SOLO en formato JSON válido, sin markdown ni bloques de código:
{
    "needs": true/false,
    "type": "product|category|brand|general",
    "query": "término de búsqueda específico o frase clave del mensaje"
}

EJEMPLOS:
Cliente: "¿Tienen repuestos de motor?"
Respuesta: {"needs": true, "type": "category", "query": "repuestos de motor"}

Cliente: "Busco partes de Toyota"
Respuesta: {"needs": true, "type": "brand", "query": "Toyota"}

Cliente: "¿Cuánto cuesta el filtro de aceite?"
Respuesta: {"needs": true, "type": "product", "query": "filtro de aceite"}

Cliente: "Hola, ¿cómo están?"
Respuesta: {"needs": false, "type": "general", "query": ""}`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            let responseText = response.text().trim();
            
            // Limpiar markdown code blocks si existen
            responseText = this.cleanJsonResponse(responseText);
            
            try {
                const result = JSON.parse(responseText);
                this.logger.logIA(`Análisis de necesidad de producto (sin contexto): ${responseText}`);
                return result;
            } catch (parseError) {
                this.logger.logException('IaService', 'analyzeProductInformationNeeds', `Error parseando JSON: ${parseError}. Respuesta cruda: ${responseText}`);
                return { needs: false, type: 'general', query: '' };
            }
        } catch (error) {
            this.logger.logException('IaService', 'analyzeProductInformationNeeds', error);
            return { needs: false, type: 'general', query: '' };
        }
    }

    /**
     * Cleans JSON response by removing markdown code blocks
     * @param response Raw response from AI
     * @returns Cleaned JSON string
     */
    private cleanJsonResponse(response: string): string {
        // Remover bloques de código markdown
        response = response.replace(/```json\s*/g, '');
        response = response.replace(/```\s*/g, '');
        
        // Remover espacios extra al inicio y final
        response = response.trim();
        
        // Si la respuesta empieza y termina con comillas, removerlas
        if (response.startsWith('"') && response.endsWith('"')) {
            response = response.slice(1, -1);
        }
        
        return response;
    }

    /**
     * Analyzes if the user's message requires product information considering chat context.
     * @param messageText The user's message text
     * @param context Chat history context
     * @returns Analysis result indicating if product info is needed
     */
    async analyzeProductInformationNeedsWithContext(
        messageText: string,
        context: { summary: string; recentMessages: any[] }
    ): Promise<{
        needs: boolean;
        type: 'product' | 'category' | 'brand' | 'general';
        query: string;
    }> {
        try {
            let contextText = '';
            if (context.summary) {
                contextText += `CONTEXTO PREVIO: ${context.summary}\n\n`;
            }
            if (context.recentMessages && context.recentMessages.length > 0) {
                contextText += 'MENSAJES RECIENTES:\n';
                context.recentMessages.forEach((msg: any) => {
                    contextText += `${msg.role === 'user' ? 'Cliente' : 'Asistente'}: ${msg.content}\n`;
                });
                contextText += '\n';
            }

            const prompt = `${contextText}NUEVO MENSAJE DEL CLIENTE: "${messageText}"

Considerando el contexto, determina si el cliente está pidiendo información específica sobre:
- PRODUCTOS (repuestos, partes específicas, inventario, precios, características)
- CATEGORÍAS (tipos de productos, grupos de repuestos)
- MARCAS (fabricantes específicos, productos de una marca)
- GENERAL (saludos, consultas generales no relacionadas con productos)

Responde SOLO en formato JSON válido, sin markdown ni bloques de código:
{
    "needs": true/false,
    "type": "product|category|brand|general",
    "query": "término de búsqueda específico considerando el contexto"
}`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            let responseText = response.text().trim();
            
            // Limpiar markdown code blocks si existen
            responseText = this.cleanJsonResponse(responseText);
            
            try {
                const result = JSON.parse(responseText);
                this.logger.logIA(`Análisis de necesidad de producto (con contexto): ${responseText}`);
                return result;
            } catch (parseError) {
                this.logger.logException('IaService', 'analyzeProductInformationNeedsWithContext', `Error parseando JSON: ${parseError}. Respuesta cruda: ${responseText}`);
                return { needs: false, type: 'general', query: '' };
            }
        } catch (error) {
            this.logger.logException('IaService', 'analyzeProductInformationNeedsWithContext', error);
            return { needs: false, type: 'general', query: '' };
        }
    }

    /**
     * Generates a personalized response based on user information.
     * @param messages Original user messages
     * @param initialResponse Initial AI response
     * @param userInfo User information
     * @returns Personalized response
     */
    async generatePersonalizedResponse(
        messages: MessageData[],
        initialResponse: string,
        userInfo: any
    ): Promise<string> {
        try {
            const messageText = messages
                .filter(msg => msg.type === 'text' && msg.content)
                .map(msg => msg.content)
                .join(' ');

            let userText = '';
            if (userInfo?.isRegistered) {
                userText = `INFORMACIÓN DEL CLIENTE:
Nombre: ${userInfo.name} ${userInfo.lastName}
Rol: ${userInfo.role}
Estado: ${userInfo.status}
Cliente registrado: Sí

`;
            } else {
                userText = `INFORMACIÓN DEL CLIENTE:
Teléfono: ${userInfo.phoneNumber}
Cliente registrado: No

`;
            }

            const prompt = `${userText}El cliente preguntó: "${messageText}"

Mi respuesta inicial fue: "${initialResponse}"

Genera una respuesta NATURAL Y AMIGABLE que:
1. ${userInfo?.isRegistered ? `Use el nombre del cliente: ${userInfo.name}` : 'Sea amigable sin mencionar registro'}
2. Sea CORTA y conversacional (máximo 1-2 oraciones)
3. Use emojis apropiados pero sin exceso
4. Responda de manera útil y servicial
5. ${userInfo?.isRegistered ? 'Como cliente registrado, dale un trato más personalizado' : 'NO menciones registro ni beneficios'}
6. Mantén un tono natural, como si fueras un amigo ayudando

${userInfo?.isRegistered ? 
`Dirígete al cliente por su nombre: ${userInfo.name}. Sé natural y cálido.` : 
'Mantén la conversación amigable y natural, sin mencionar registro.'
}`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const responseText = response.text();
            this.logger.logIA(`Respuesta personalizada (sin contexto) generada: ${responseText}`);
            return responseText;
        } catch (error) {
            this.logger.logException('IaService', 'generatePersonalizedResponse', error);
            return initialResponse; // Fallback a la respuesta inicial
        }
    }

    /**
     * Generates a personalized response with context based on user information.
     * @param messages Original user messages
     * @param context Chat history context
     * @param initialResponse Initial AI response
     * @param userInfo User information
     * @returns Personalized response with context
     */
    async generatePersonalizedResponseWithContext(
        messages: MessageData[],
        context: { summary: string; recentMessages: any[] },
        initialResponse: string,
        userInfo: any
    ): Promise<string> {
        try {
            const messageText = messages
                .filter(msg => msg.type === 'text' && msg.content)
                .map(msg => msg.content)
                .join(' ');

            let contextText = '';
            if (context.summary) {
                contextText += `CONTEXTO PREVIO: ${context.summary}\n`;
            }

            let userText = '';
            if (userInfo?.isRegistered) {
                userText = `INFORMACIÓN DEL CLIENTE:
Nombre: ${userInfo.name} ${userInfo.lastName}
Rol: ${userInfo.role}
Estado: ${userInfo.status}
Cliente registrado: Sí

`;
            } else {
                userText = `INFORMACIÓN DEL CLIENTE:
Teléfono: ${userInfo.phoneNumber}
Cliente registrado: No

`;
            }

            const prompt = `${contextText}${userText}El cliente preguntó: "${messageText}"

Mi respuesta inicial fue: "${initialResponse}"

Genera una respuesta NATURAL Y CONTEXTUAL que:
1. Considere el contexto de la conversación previa
2. ${userInfo?.isRegistered ? `Use el nombre del cliente: ${userInfo.name}` : 'Sea amigable sin mencionar registro'}
3. Sea CORTA y conversacional (máximo 1-2 oraciones)
4. Use emojis apropiados pero sin exceso
5. Mantenga continuidad con el tema de conversación
6. ${userInfo?.isRegistered ? 'Mantenga continuidad personalizada' : 'NO menciones registro'}
7. Responda de manera útil considerando la historia previa

${userInfo?.isRegistered ? 
`Dirígete al cliente por su nombre: ${userInfo.name}. Mantén la conversación natural y contextual.` : 
'Mantén la conversación fluida y contextual sin mencionar registro.'
}

NO repitas saludos innecesarios. Mantén la conversación natural y fluida.`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const responseText = response.text();
            this.logger.logIA(`Respuesta personalizada (con contexto) generada: ${responseText}`);
            return responseText;
        } catch (error) {
            this.logger.logException('IaService', 'generatePersonalizedResponseWithContext', error);
            return initialResponse; // Fallback a la respuesta inicial
        }
    }

    /**
     * Generates a response with product information and user data.
     * @param messages Original user messages
     * @param initialResponse Initial AI response
     * @param productInfo Product information found
     * @param userInfo User information
     * @returns Enhanced response with product information and user personalization
     */
    async generateResponseWithProductInfoAndUser(
        messages: MessageData[],
        initialResponse: string,
        databaseInfo: any,
        userInfo: any
    ): Promise<string> {
        try {
            const messageText = messages
                .filter(msg => msg.type === 'text' && msg.content)
                .map(msg => msg.content)
                .join(' ');

            let userText = '';
            if (userInfo?.isRegistered) {
                userText = `INFORMACIÓN DEL CLIENTE:
Nombre: ${userInfo.name} ${userInfo.lastName}
Rol: ${userInfo.role}
Estado: ${userInfo.status}
Cliente registrado: Sí

`;
            } else {
                userText = `INFORMACIÓN DEL CLIENTE:
Teléfono: ${userInfo.phoneNumber}
Cliente registrado: No

`;
            }

            const databaseContext = databaseInfo.error ? 
                `Error en búsqueda: ${databaseInfo.error}` :
                `INFORMACIÓN ENCONTRADA EN BASE DE DATOS:
Consulta SQL ejecutada: ${databaseInfo.sql_executed}
Total resultados: ${databaseInfo.total}
Datos encontrados:
${JSON.stringify(databaseInfo.data, null, 2)}`;

            const prompt = `${userText}El cliente preguntó: "${messageText}"

Mi respuesta inicial fue: "${initialResponse}"

${databaseContext}

Genera una respuesta NATURAL que incluya la información de productos:
1. ${userInfo?.isRegistered ? `Saluda al cliente por su nombre: ${userInfo.name}` : 'Saluda de manera amigable'}
2. Incluya la información específica de productos encontrados
3. Sea CONVERSACIONAL y no demasiado larga (máximo 2-3 oraciones)
4. Use emojis apropiados pero sin exceso
5. Si se encontraron productos, menciona nombres y precios de manera natural
6. Si no se encontraron productos, sugiere alternativas de forma amigable
7. ${userInfo?.isRegistered ? 'Mantenga tono personalizado' : 'NO menciones registro ni beneficios'}
8. Termina preguntando si necesita más información o si le interesa algo específico

${userInfo?.isRegistered ? `Dirígete al cliente por su nombre: ${userInfo.name} de manera natural.` : 'Mantén un tono amigable y profesional sin mencionar registro.'}

Sé natural y útil, como un vendedor amigable que realmente quiere ayudar.`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const responseText = response.text();
            this.logger.logIA(`Respuesta con info de producto y usuario (sin contexto) generada: ${responseText}`);
            return responseText;
        } catch (error) {
            this.logger.logException('IaService', 'generateResponseWithProductInfoAndUser', error);
            return initialResponse; // Fallback a la respuesta inicial
        }
    }

    /**
     * Generates a response with product information, context and user data.
     * @param messages Original user messages
     * @param context Chat history context
     * @param initialResponse Initial AI response
     * @param productInfo Product information found
     * @param userInfo User information
     * @returns Enhanced response with all information combined
     */
    async generateResponseWithProductInfoContextAndUser(
        messages: MessageData[],
        context: { summary: string; recentMessages: any[] },
        initialResponse: string,
        databaseInfo: any,
        userInfo: any
    ): Promise<string> {
        try {
            const messageText = messages
                .filter(msg => msg.type === 'text' && msg.content)
                .map(msg => msg.content)
                .join(' ');

            let contextText = '';
            if (context.summary) {
                contextText += `CONTEXTO PREVIO: ${context.summary}\n`;
            }

            let userText = '';
            if (userInfo?.isRegistered) {
                userText = `INFORMACIÓN DEL CLIENTE:
Nombre: ${userInfo.name} ${userInfo.lastName}
Rol: ${userInfo.role}
Estado: ${userInfo.status}
Cliente registrado: Sí

`;
            } else {
                userText = `INFORMACIÓN DEL CLIENTE:
Teléfono: ${userInfo.phoneNumber}
Cliente registrado: No

`;
            }

            const databaseContext = databaseInfo.error ? 
                `Error en búsqueda: ${databaseInfo.error}` :
                `INFORMACIÓN ENCONTRADA EN BASE DE DATOS:
Consulta SQL ejecutada: ${databaseInfo.sql_executed}
Total resultados: ${databaseInfo.total}
Datos encontrados:
${JSON.stringify(databaseInfo.data, null, 2)}`;

            const prompt = `${contextText}${userText}
ROL Y OBJETIVO: Eres un asistente de ventas experto y amigable. Tu objetivo es ayudar al cliente a encontrar el producto perfecto y cerrar una venta. Debes ser proactivo, conocedor y servicial.

HISTORIAL Y CONTEXTO:
- Pregunta del cliente: "${messageText}"
- Mi análisis inicial (intención y respuesta sugerida): "${initialResponse}"
- Resultados de la búsqueda en base de datos:
${databaseContext}

INSTRUCCIONES PARA LA RESPUESTA FINAL:
1.  **Actúa como Vendedor Experto**: Usa tu conocimiento para guiar al cliente.
2.  **Usa la Información de la Base de Datos**:
    *   **Si se encontraron productos relevantes (${databaseInfo.total > 0})**: Preséntalos de forma atractiva. Menciona el nombre y alguna característica clave. Pregunta cuál le interesa más para darle más detalles o si quiere cotizar.
    *   **Si NO se encontraron productos (${databaseInfo.total === 0}) pero el cliente hizo una consulta específica**: Discúlpate amablemente y ofrece buscar alternativas similares. Pregúntale si está abierto a otras marcas o modelos.
    *   **Si NO se encontraron productos y la consulta fue GENERAL (ej: "ver productos")**: Responde que manejas muchas categorías. Menciona 2 o 3 categorías principales (ej: "herramientas eléctricas, equipo de construcción, refacciones") y pregunta en cuál está interesado para poder mostrarle opciones.
3.  **Personaliza**: Si conoces el nombre del cliente (${userInfo.name}), úsalo.
4.  **Tono**: Mantén un tono cálido, profesional y proactivo. Usa emojis para conectar (🔧, ✨, 🔩, ✅).
5.  **Sé Conciso**: La respuesta debe ser clara y no demasiado larga (2-4 oraciones).
6.  **Llamada a la Acción**: Termina siempre con una pregunta para mantener la conversación activa y guiar al cliente (ej: "¿Cuál de estos te llama más la atención?", "¿Te gustaría ver más detalles de alguno?", "¿En qué categoría te gustaría que nos enfoquemos?").

Ahora, genera la respuesta final para el cliente.`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const responseText = response.text();
            this.logger.logIA(`Respuesta con info de producto, contexto y usuario generada: ${responseText}`);
            return responseText;
        } catch (error) {
            this.logger.logException('IaService', 'generateResponseWithProductInfoContextAndUser', error);
            return initialResponse; // Fallback a la respuesta inicial
        }
    }

    /**
     * Splits a long response into multiple shorter messages if needed
     * @param response Original response
     * @returns Array of shorter messages
     */
    splitResponseIntoMessages(response: string): string[] {
        const maxLength = 160; // Longitud máxima por mensaje
        const messages: string[] = [];
        
        // Si el mensaje es corto, devolver como está
        if (response.length <= maxLength) {
            return [response];
        }
        
        // Dividir por oraciones primero
        const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
        let currentMessage = '';
        
        for (const sentence of sentences) {
            const trimmedSentence = sentence.trim();
            if (!trimmedSentence) continue;
            
            const potentialMessage = currentMessage + (currentMessage ? '. ' : '') + trimmedSentence + '.';
            
            if (potentialMessage.length <= maxLength) {
                currentMessage = potentialMessage;
            } else {
                if (currentMessage) {
                    messages.push(currentMessage);
                    currentMessage = trimmedSentence + '.';
                } else {
                    // Si una oración sola es muy larga, dividir por palabras
                    const words = trimmedSentence.split(' ');
                    let wordMessage = '';
                    
                    for (const word of words) {
                        const potentialWordMessage = wordMessage + (wordMessage ? ' ' : '') + word;
                        if (potentialWordMessage.length <= maxLength - 1) { // -1 para el punto
                            wordMessage = potentialWordMessage;
                        } else {
                            if (wordMessage) {
                                messages.push(wordMessage + '.');
                                wordMessage = word;
                            } else {
                                messages.push(word + '.');
                            }
                        }
                    }
                    if (wordMessage) {
                        currentMessage = wordMessage + '.';
                    }
                }
            }
        }
        
        if (currentMessage) {
            messages.push(currentMessage);
        }
        
        return messages.length > 0 ? messages : [response];
    }

    /**
     * Genera una consulta SQL basada en el mensaje del usuario y la estructura de la BD
     */
    async generateSQLQuery(
        messageText: string,
        searchRequest: { type: string; query: string },
        dbStructure: string
    ): Promise<string> {
        try {
            // La búsqueda de productos ahora se maneja directamente en IntentService
            // con una consulta estándar. Esta función se reserva para otras consultas específicas.
            if (searchRequest.type === 'product' || searchRequest.type === 'category' || searchRequest.type === 'brand') {
                this.logger.logIA('Advertencia: generateSQLQuery fue llamado para una búsqueda de productos, pero esto ahora se maneja en IntentService. Devolviendo consulta vacía.');
                return ''; // Devolver vacío para que IntentService no intente ejecutar nada.
            }

            // Para otras consultas específicas, usar IA
            const prompt = `
${this.SQL_INSTRUCTIONS}

ESTRUCTURA DE LA BASE DE DATOS:
${dbStructure}

SOLICITUD DEL CLIENTE: "${messageText}"
TIPO DE BÚSQUEDA: ${searchRequest.type}
QUERY: ${searchRequest.query}

Genera la consulta SQL siguiendo EXACTAMENTE las instrucciones arriba.
`;

            const response = await this.model.generateContent(prompt);
            const cleanedQuery = this.cleanJsonResponse(response.response.text()).trim();
            
            // Remover posibles markdown o formateo
            let sqlQuery = cleanedQuery;
            if (sqlQuery.startsWith('```sql')) {
                sqlQuery = sqlQuery.replace(/```sql\n?/, '').replace(/\n?```$/, '');
            } else if (sqlQuery.startsWith('```')) {
                sqlQuery = sqlQuery.replace(/```\n?/, '').replace(/\n?```$/, '');
            }
            
            // Remover prefijo "sql" si existe
            if (sqlQuery.toLowerCase().startsWith('sql ') || sqlQuery.toLowerCase().startsWith('sql\n')) {
                sqlQuery = sqlQuery.substring(3).trim();
            }

            this.logger.logIA(`IA generó consulta SQL: ${sqlQuery}`);
            return sqlQuery.trim();

        } catch (error) {
            this.logger.logException('IaService', 'generateSQLQuery', error);
            throw error;
        }
    }

    /**
     * Genera una consulta SQL con contexto de conversación previa
     */
    async generateSQLQueryWithContext(
        messageText: string,
        searchRequest: { type: string; query: string },
        context: { summary: string; recentMessages: any[] },
        dbStructure: string
    ): Promise<string> {
        try {
            // La búsqueda de productos ahora se maneja directamente en IntentService
            // con una consulta estándar. Esta función se reserva para otras consultas específicas.
            if (searchRequest.type === 'product' || searchRequest.type === 'category' || searchRequest.type === 'brand') {
                this.logger.logIA('Advertencia: generateSQLQueryWithContext fue llamado para una búsqueda de productos, pero esto ahora se maneja en IntentService. Devolviendo consulta vacía.');
                return ''; // Devolver vacío para que IntentService no intente ejecutar nada.
            }

            // Para otras consultas específicas, usar IA con contexto
            const contextMessages = context.recentMessages
                .map(msg => `${msg.role}: ${msg.content}`)
                .join('\n');

            const prompt = `
${this.SQL_INSTRUCTIONS}

ESTRUCTURA DE LA BASE DE DATOS:
${dbStructure}

CONTEXTO DE LA CONVERSACIÓN:
RESUMEN: ${context.summary}

MENSAJES RECIENTES:
${contextMessages}

SOLICITUD ACTUAL: "${messageText}"
TIPO DE BÚSQUEDA: ${searchRequest.type}
QUERY: ${searchRequest.query}

CONSIDERACIONES ADICIONALES PARA EL CONTEXTO:
- Si mencionaron precios, agregar filtros: AND p.price < 1000
- Si mencionaron marca específica: AND b.name LIKE '%marca%'
- Si hablaron de categoría: AND c.name LIKE '%categoría%'
- Si pidieron productos baratos: ORDER BY p.price ASC
- Si pidieron productos caros: ORDER BY p.price DESC

Genera la consulta SQL siguiendo las instrucciones base y considerando el contexto.
`;

            const response = await this.model.generateContent(prompt);
            const cleanedQuery = this.cleanJsonResponse(response.response.text()).trim();
            
            // Remover posibles markdown o formateo
            let sqlQuery = cleanedQuery;
            if (sqlQuery.startsWith('```sql')) {
                sqlQuery = sqlQuery.replace(/```sql\n?/, '').replace(/\n?```$/, '');
            } else if (sqlQuery.startsWith('```')) {
                sqlQuery = sqlQuery.replace(/```\n?/, '').replace(/\n?```$/, '');
            }
            
            // Remover prefijo "sql" si existe
            if (sqlQuery.toLowerCase().startsWith('sql ') || sqlQuery.toLowerCase().startsWith('sql\n')) {
                sqlQuery = sqlQuery.substring(3).trim();
            }

            this.logger.logIA(`IA generó consulta SQL con contexto: ${sqlQuery}`);
            return sqlQuery.trim();

        } catch (error) {
            this.logger.logException('IaService', 'generateSQLQueryWithContext', error);
            throw error;
        }
    }

    /**
     * Filtra productos relevantes basado en la consulta del usuario
     */
    async filterRelevantProducts(
        userQuery: string,
        allProducts: any[],
        maxResults: number = 10
    ): Promise<any[]> {
        try {
            if (!allProducts || allProducts.length === 0) {
                return [];
            }

            const productsText = allProducts.map(product => 
                `ID: ${product.id}, Nombre: ${product.name}, Descripción: ${product.description || ''}, Marca: ${product.brand_name || 'N/A'}, Categoría: ${product.category_name || 'N/A'}`
            ).join('\n');

            const prompt = `CONSULTA DEL USUARIO: "${userQuery}"

LISTA COMPLETA DE PRODUCTOS DISPONIBLES EN LA BASE DE DATOS:
${productsText}

INSTRUCCIONES CRÍTICAS:
1.  Analiza la "CONSULTA DEL USUARIO" y compárala con la "LISTA COMPLETA DE PRODUCTOS".
2.  Tu objetivo es encontrar los productos que MEJOR satisfacen la necesidad del usuario.
3.  Considera sinónimos, marcas, modelos y características implícitas. Por ejemplo, si el usuario pide "amoladora Makita", debes encontrar productos cuyo nombre contenga "amoladora" y la marca sea "Makita".
4.  Si el usuario es ambiguo, devuelve los productos que parezcan más relevantes.
5.  Devuelve como máximo los ${maxResults} productos más relevantes.

Responde ÚNICAMENTE con un array JSON que contenga los IDs de los productos más relevantes, ordenados del más al menos relevante.
Ejemplo de respuesta: [10, 54, 2]

Si NINGÚN producto de la lista es relevante para la consulta del usuario, responde con un array vacío: []

NO incluyas explicaciones ni texto adicional, solo el array de IDs en formato JSON.`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            let responseText = response.text().trim();
            
            // Limpiar respuesta
            responseText = this.cleanJsonResponse(responseText);
            
            try {
                const relevantIds = JSON.parse(responseText);
                
                if (!Array.isArray(relevantIds)) {
                    this.logger.logException('IaService', 'filterRelevantProducts', `IA no devolvió array válido: ${responseText}`);
                    return allProducts.slice(0, maxResults); // Fallback: primeros N productos
                }

                // Filtrar productos basado en IDs relevantes
                const relevantProducts = relevantIds
                    .map(id => allProducts.find(p => p.id == id))
                    .filter(product => product !== undefined)
                    .slice(0, maxResults);

                this.logger.logIA(`IA filtró ${relevantProducts.length} productos relevantes de ${allProducts.length} totales`);
                return relevantProducts;

            } catch (parseError) {
                this.logger.logException('IaService', 'filterRelevantProducts', `Error parseando JSON: ${parseError}. Respuesta cruda: ${responseText}`);
                // Fallback: devolver primeros productos
                return allProducts.slice(0, maxResults);
            }

        } catch (error) {
            this.logger.logException('IaService', 'filterRelevantProducts', error);
            // Fallback: devolver primeros productos
            return allProducts.slice(0, maxResults);
        }
    }

    /**
     * Analyzes if the user's message requires a report.
     * @param messageText The user's message text
     * @returns Analysis result indicating if report is needed
     */
    async analyzeReportNeeds(messageText: string): Promise<{
        needs: boolean;
        type: 'sales_report' | 'order_report' | 'custom_report' | 'quotation' | 'none';
        params?: any;
    }> {
        try {
            const prompt = `Analiza este mensaje del cliente: "${messageText}"

${this.REPORT_ANALYSIS_INSTRUCTIONS}`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            let responseText = response.text().trim();
            
            responseText = this.cleanJsonResponse(responseText);
            
            try {
                const result = JSON.parse(responseText);
                this.logger.logIA(`Análisis de necesidad de reporte (sin contexto): ${responseText}`);
                return result;
            } catch (parseError) {
                this.logger.logException('IaService', 'analyzeReportNeeds', `Error parseando JSON: ${parseError}. Respuesta cruda: ${responseText}`);
                return { needs: false, type: 'none' };
            }
        } catch (error) {
            this.logger.logException('IaService', 'analyzeReportNeeds', error);
            return { needs: false, type: 'none' };
        }
    }

    /**
     * Analyzes if the user's message requires a report considering context.
     * @param messageText The user's message text
     * @param context Chat history context
     * @returns Analysis result indicating if report is needed
     */
    async analyzeReportNeedsWithContext(
        messageText: string,
        context: { summary: string; recentMessages: any[] }
    ): Promise<{
        needs: boolean;
        type: 'sales_report' | 'order_report' | 'custom_report' | 'quotation' | 'none';
        params?: any;
    }> {
        try {
            let contextText = '';
            if (context.summary) {
                contextText += `CONTEXTO PREVIO: ${context.summary}\\n\\n`;
            }
            if (context.recentMessages && context.recentMessages.length > 0) {
                contextText += 'MENSAJES RECIENTES:\\n';
                context.recentMessages.forEach((msg: any) => {
                    contextText += `${msg.role === 'user' ? 'Cliente' : 'Asistente'}: ${msg.content}\\n`;
                });
                contextText += '\\n';
            }

            const prompt = `${contextText}NUEVO MENSAJE DEL CLIENTE: "${messageText}"

${this.REPORT_ANALYSIS_INSTRUCTIONS}`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            let responseText = response.text().trim();
            
            responseText = this.cleanJsonResponse(responseText);
            
            try {
                const result = JSON.parse(responseText);
                this.logger.logIA(`Análisis de necesidad de reporte (con contexto): ${responseText}`);
                return result;
            } catch (parseError) {
                this.logger.logException('IaService', 'analyzeReportNeedsWithContext', `Error parseando JSON: ${parseError}. Respuesta cruda: ${responseText}`);
                return { needs: false, type: 'none' };
            }
        } catch (error) {
            this.logger.logException('IaService', 'analyzeReportNeedsWithContext', error);
            return { needs: false, type: 'none' };
        }
    }

    /**
     * Genera una consulta SQL para reportes personalizados
     */
    async generateReportQuery(description: string, dbStructure: string): Promise<string> {
        try {
            const prompt = `
${this.SQL_INSTRUCTIONS}

ESTRUCTURA DE LA BASE DE DATOS:
${dbStructure}

DESCRIPCIÓN DEL REPORTE: "${description}"

INSTRUCCIONES ADICIONALES PARA REPORTES:
- Para reportes usar LIMIT 100 (no 15)
- Incluir campos informativos: nombres, fechas, totales
- Usar GROUP BY para agregaciones: COUNT(*), SUM(), AVG()
- Para reportes de ventas incluir fechas y totales
- Para reportes de productos incluir stock y precios

EJEMPLOS DE REPORTES:
- "productos más vendidos" -> SELECT p.name, COUNT(*) as veces_vendido FROM order_detail od JOIN product p ON od.product_id = p.id WHERE p.deleted_at IS NULL GROUP BY p.id ORDER BY veces_vendido DESC LIMIT 10
- "ventas por fecha" -> SELECT DATE(o.created_at) as fecha, COUNT(*) as ordenes FROM order o WHERE o.deleted_at IS NULL GROUP BY DATE(o.created_at) ORDER BY fecha DESC LIMIT 30

Genera la consulta SQL para el reporte solicitado.
`;

            const response = await this.model.generateContent(prompt);
            const cleanedQuery = this.cleanJsonResponse(response.response.text()).trim();
            
            // Remover markdown si existe
            let sqlQuery = cleanedQuery;
            if (sqlQuery.startsWith('```sql')) {
                sqlQuery = sqlQuery.replace(/```sql\n?/, '').replace(/\n?```$/, '');
            } else if (sqlQuery.startsWith('```')) {
                sqlQuery = sqlQuery.replace(/```\n?/, '').replace(/\n?```$/, '');
            }
            
            // Remover prefijo "sql" si existe
            if (sqlQuery.toLowerCase().startsWith('sql ') || sqlQuery.toLowerCase().startsWith('sql\n')) {
                sqlQuery = sqlQuery.substring(3).trim();
            }

            this.logger.logIA(`IA generó consulta para reporte: ${sqlQuery}`);
            return sqlQuery.trim();

        } catch (error) {
            this.logger.logException('IaService', 'generateReportQuery', error);
            throw error;
        }
    }

    /**
     * Transcribes an audio buffer using the Gemini API.
     * @param audioBuffer The audio data as a Buffer.
     * @param mimeType The MIME type of the audio (e.g., 'audio/ogg').
     * @returns The transcribed text.
     */
    async transcribeAudio(audioBuffer: Buffer, mimeType: string = 'audio/ogg'): Promise<string> {
        try {
            this.logger.logIA(`Iniciando transcripción de audio. Tamaño: ${audioBuffer.length} bytes, MimeType: ${mimeType}`);

            const audioFilePart: Part = {
                inlineData: {
                    mimeType,
                    data: audioBuffer.toString('base64'),
                },
            };

            const prompt = "Transcribe el siguiente audio. Responde únicamente con el texto transcrito, sin añadir ninguna otra palabra o explicación.";
            
            const result = await this.model.generateContent([prompt, audioFilePart]);
            const response = await result.response;
            const transcribedText = response.text();

            this.logger.logIA(`Audio transcrito exitosamente: "${transcribedText}"`);
            return transcribedText;

        } catch (error) {
            this.logger.logException('IaService', 'transcribeAudio', error);
            throw new InternalServerErrorException('Error comunicándose con el servicio de IA para transcribir el audio.');
        }
    }

    async analyzeIntentAndEntities(
        messages: MessageData[],
        context: { summary: string; recentMessages: any[] }
    ): Promise<ComprehensiveIntent> {
        try {
            const contents: any[] = [];
            let textContent = '';

            if (context.summary) {
                textContent += `RESUMEN DE CONVERSACIÓN PREVIA: ${context.summary}\n\n`;
            }

            if (context.recentMessages && context.recentMessages.length > 0) {
                textContent += 'MENSAJES RECIENTES:\n';
                context.recentMessages.forEach((msg: any) => {
                    textContent += `${msg.role === 'user' ? 'Cliente' : 'Asistente'}: ${msg.content}\n`;
                });
                textContent += '\n';
            }

            textContent += 'NUEVOS MENSAJES DEL CLIENTE:\n\n';

            for (const msg of messages) {
                textContent += `${msg.messageNumber}. `;
                switch (msg.type) {
                    case 'text':
                        textContent += `Texto: "${msg.content}"\n`;
                        break;
                    case 'image':
                        if (msg.imageBuffer) {
                            textContent += `Imagen${msg.caption ? ` con texto: "${msg.caption}"` : ''} (analizar imagen adjunta)\n`;
                            contents.push({
                                inlineData: {
                                    data: msg.imageBuffer.toString('base64'),
                                    mimeType: 'image/jpeg'
                                }
                            });
                        } else {
                            textContent += `Imagen${msg.caption ? ` con texto: "${msg.caption}"` : ''}\n`;
                        }
                        break;
                    default:
                        textContent += `Mensaje de tipo ${msg.type}\n`;
                }
            }

            textContent += `\n${this.COMPREHENSIVE_INTENT_ANALYSIS_INSTRUCTIONS}`;

            const finalContents = [
                { text: textContent },
                ...contents
            ];

            this.logger.logIA(`\n\n==================== PROMPT PARA IA ====================\n${textContent}\n======================================================\n\n`);

            const result = await this.model.generateContent(finalContents);
            const response = await result.response;
            let responseText = this.cleanJsonResponse(response.text());

            try {
                const parsedResult = JSON.parse(responseText);
                this.logger.logIA(`Análisis comprensivo de intención: ${responseText}`);
                return parsedResult;
            } catch (parseError) {
                this.logger.logException('IaService', 'analyzeIntentAndEntities', `Error parseando JSON: ${parseError}. Respuesta cruda: ${responseText}`);
                // Fallback a una respuesta genérica
                return {
                    intent: 'general_question',
                    entities: { query: null },
                    suggested_response: 'No estoy seguro de cómo ayudarte con eso. ¿Podrías reformular tu pregunta?'
                };
            }
        } catch (error) {
            this.logger.logException('IaService', 'analyzeIntentAndEntities', error);
            // Rethrow or handle gracefully
            throw new InternalServerErrorException('Error comunicándose con el servicio de IA para analizar la intención.');
        }
    }
}
