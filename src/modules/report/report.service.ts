import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import * as ExcelJS from 'exceljs';
const pdfMake = require('pdfmake/build/pdfmake');
const pdfFonts = require('pdfmake/build/vfs_fonts');
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { Order } from '../order/entity/order.entity';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import * as fs from 'fs';
import * as path from 'path';
import { stringConstants } from '../../utils/string.constant';

interface ReportData {
    key: string;
    value: any;
}

@Injectable()
export class ReportService {
    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @Inject(forwardRef(() => WhatsappService))
        private whatsappService: WhatsappService,
    ) {
        (pdfMake as any).vfs = pdfFonts.vfs;
        this.loadImages();
    }

    private loadImages() {
        try {
            const utilsPath = path.join(process.cwd(), 'src', 'utils');
            
            // Cargar imagen izquierda
            const leftImagePath = path.join(utilsPath, 'libamaq-izquierda.png');
            if (fs.existsSync(leftImagePath)) {
                const leftImageBuffer = fs.readFileSync(leftImagePath);
                const leftImageBase64 = `data:image/png;base64,${leftImageBuffer.toString('base64')}`;
                (pdfMake as any).vfs['libamaq-izquierda.png'] = leftImageBase64;
                console.log('Imagen izquierda cargada correctamente');
            } else {
                console.error('No se encontró la imagen izquierda en:', leftImagePath);
            }
            
            // Cargar imagen derecha
            const rightImagePath = path.join(utilsPath, 'libamaq-derecha.png');
            if (fs.existsSync(rightImagePath)) {
                const rightImageBuffer = fs.readFileSync(rightImagePath);
                const rightImageBase64 = `data:image/png;base64,${rightImageBuffer.toString('base64')}`;
                (pdfMake as any).vfs['libamaq-derecha.png'] = rightImageBase64;
                console.log('Imagen derecha cargada correctamente');
            } else {
                console.error('No se encontró la imagen derecha en:', rightImagePath);
            }
        } catch (error) {
            console.error('Error loading images for PDF:', error);
        }
    }

    async generateSalesReportByDateRange(startDate: Date, endDate: Date) {
        try {
            const orders = await this.orderRepository.find({
                where: {
                    createdAt: Between(startDate, endDate),
                },
                relations: ['user', 'orderHistory'],
            });

            const reportData: ReportData[] = orders.flatMap(order => [
                { key: 'fecha', value: order.createdAt?.toLocaleDateString() || 'N/A' },
                { key: 'cliente', value: order.user?.name || 'N/A' },
                { key: 'total', value: order.orderHistory?.total || 0 },
                { key: 'tipo', value: order.type || 'N/A' }
            ]);

            const [pdfReport, excelReport] = await Promise.all([
                this.generatePDF(reportData, 'Reporte de Ventas'),
                this.generateExcel(reportData, 'Ventas')
            ]);

            return {
                success: true,
                data: {
                    pdf: pdfReport,
                    excel: excelReport
                }
            };
        } catch (error) {
            console.error('Error generating sales report:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido al generar reportes.'
            };
        }
    }

    /**
     * Genera y envía reporte de ventas por WhatsApp
     */
    async generateAndSendSalesReport(startDate: Date, endDate: Date, phoneNumber: string) {
        try {
            const orders = await this.orderRepository.find({
                where: {
                    createdAt: Between(startDate, endDate),
                },
                relations: ['user', 'orderHistory'],
            });

            // Calcular estadísticas
            const totalOrders = orders.length;
            const totalSales = orders.reduce((sum, order) => sum + (order.orderHistory?.total || 0), 0);
            const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

            const reportData: ReportData[] = [
                { key: 'Período', value: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}` },
                { key: 'Total Órdenes', value: totalOrders },
                { key: 'Ventas Totales', value: `$${totalSales.toFixed(2)}` },
                { key: 'Promedio por Orden', value: `$${avgOrderValue.toFixed(2)}` },
                { key: 'Detalles por Orden', value: '' }
            ];

            // Agregar detalles de cada orden
            orders.forEach((order, index) => {
                reportData.push(
                    { key: `Orden ${index + 1} - Fecha`, value: order.createdAt?.toLocaleDateString() || 'N/A' },
                    { key: `Orden ${index + 1} - Cliente`, value: order.user?.name || 'N/A' },
                    { key: `Orden ${index + 1} - Total`, value: `$${order.orderHistory?.total || 0}` },
                    { key: `Orden ${index + 1} - Tipo`, value: order.type || 'N/A' }
                );
            });

            const [pdfReport, excelReport] = await Promise.all([
                this.generatePDF(reportData, `Reporte de Ventas ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`),
                this.generateExcel(reportData, 'Reporte Ventas')
            ]);

            // Enviar mensaje inicial con resumen
            const summaryMessage = `📊 *Reporte de Ventas*\n\n` +
                `📅 *Período:* ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}\n` +
                `📦 *Total Órdenes:* ${totalOrders}\n` +
                `💰 *Ventas Totales:* $${totalSales.toFixed(2)}\n` +
                `📈 *Promedio por Orden:* $${avgOrderValue.toFixed(2)}\n\n` +
                `Te envío los archivos detallados a continuación:`;

            await this.whatsappService.sendMessage(phoneNumber, summaryMessage);

            // Enviar documentos
            await this.whatsappService.sendDocument(
                phoneNumber,
                pdfReport,
                `reporte_ventas_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.pdf`,
                'Reporte de ventas en formato PDF'
            );

            await this.whatsappService.sendDocument(
                phoneNumber,
                excelReport,
                `reporte_ventas_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.xlsx`,
                'Reporte de ventas en formato Excel'
            );

            return {
                success: true,
                message: 'Reporte generado y enviado exitosamente',
                data: {
                    totalOrders,
                    totalSales,
                    avgOrderValue
                }
            };
        } catch (error) {
            console.error('Error generating and sending sales report:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido al generar y enviar el reporte.'
            };
        }
    }

    /**
     * Genera reporte personalizado basado en datos SQL y lo envía por WhatsApp
     */
    async generateAndSendCustomReport(data: any[], title: string, phoneNumber: string) {
        try {
            if (!data || data.length === 0) {
                await this.whatsappService.sendMessage(phoneNumber, 'No se encontraron datos para el reporte solicitado.');
                return { success: false, error: 'No hay datos para el reporte' };
            }

            // Convertir datos SQL a formato ReportData
            const reportData: ReportData[] = [];
            
            // Agregar headers de resumen
            reportData.push(
                { key: 'Reporte', value: title },
                { key: 'Fecha de Generación', value: new Date().toLocaleDateString() },
                { key: 'Total Registros', value: data.length },
                { key: 'Detalles', value: '' }
            );

            // Agregar datos
            data.forEach((row, index) => {
                Object.keys(row).forEach(key => {
                    reportData.push({
                        key: `Registro ${index + 1} - ${key}`,
                        value: row[key]
                    });
                });
            });

            const [pdfReport, excelReport] = await Promise.all([
                this.generatePDF(reportData, title),
                this.generateExcel(reportData, 'Reporte Personalizado')
            ]);

            // Enviar mensaje inicial
            const summaryMessage = `📊 *${title}*\n\n` +
                `📅 *Generado:* ${new Date().toLocaleDateString()}\n` +
                `📊 *Total Registros:* ${data.length}\n\n` +
                `Aquí tienes tu reporte personalizado:`;

            await this.whatsappService.sendMessage(phoneNumber, summaryMessage);

            // Enviar documentos
            const fileName = title.toLowerCase().replace(/\s+/g, '_');
            
            await this.whatsappService.sendDocument(
                phoneNumber,
                pdfReport,
                `${fileName}_${Date.now()}.pdf`,
                'Reporte personalizado en formato PDF'
            );

            await this.whatsappService.sendDocument(
                phoneNumber,
                excelReport,
                `${fileName}_${Date.now()}.xlsx`,
                'Reporte personalizado en formato Excel'
            );

            return {
                success: true,
                message: 'Reporte personalizado generado y enviado exitosamente',
                data: { totalRecords: data.length }
            };
        } catch (error) {
            console.error('Error generating and sending custom report:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error al generar reporte personalizado.'
            };
        }
    }

    async generateAndSendOrderReport(orderId: string) {
        try {
            const order = await this.orderRepository.findOne({
                where: { id: BigInt(orderId) },
                relations: ['orderDetails', 'user', 'orderHistory'],
            });

            if (!order) {
                throw new NotFoundException('Orden no encontrada');
            }

            if (!order.user?.phoneNumber) {
                throw new NotFoundException('El usuario no tiene un número de teléfono registrado');
            }

            const reportData: ReportData[] = [
                { key: 'cliente', value: order.user?.name || 'N/A' },
                { key: 'fecha', value: order.createdAt?.toLocaleDateString() || 'N/A' },
                { key: 'total', value: order.orderHistory?.total || 0 },
                { key: 'tipo', value: order.type || 'N/A' },
                {
                    key: 'detalles', value: order.orderDetails?.map(detail => ({
                        producto: detail.product?.name || 'N/A',
                        cantidad: detail.quantity,
                        precioU: detail.unitPrice,
                        total: detail.total
                    })) || []
                }
            ];

            const [pdfReport, excelReport] = await Promise.all([
                this.generatePDF(reportData, 'Reporte de Venta Individual'),
                this.generateExcel(reportData, 'Venta Individual')
            ]);

            // Enviar el mensaje inicial con los detalles de la orden
            const message = this.generateOrderMessage(order);
            await this.whatsappService.sendMessage(order.user.phoneNumber, message);

            // Enviar el reporte PDF como documento
            await this.whatsappService.sendDocument(
                order.user.phoneNumber,
                pdfReport,
                `reporte_orden_${order.id}.pdf`,
                'Aquí tienes el reporte de tu orden en formato PDF.'
            );

            // Enviar el reporte Excel como documento
            await this.whatsappService.sendDocument(
                order.user.phoneNumber,
                excelReport,
                `reporte_orden_${order.id}.xlsx`,
                'Aquí tienes el reporte de tu orden en formato Excel.'
            );

            return {
                success: true,
                message: 'Reporte y documentos enviados exitosamente',
                data: {
                    orderId: order.id,
                    customerName: order.user.name,
                    phoneNumber: order.user.phoneNumber
                }
            };
        } catch (error) {
            HandleException.exception(error);
        }
    }

    private async generatePDF(data: ReportData[], title: string): Promise<Buffer> {
        const docDefinition: TDocumentDefinitions = {
            content: [
                { text: title, style: 'header' },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', '*'],
                        body: [
                            ['Campo', 'Valor'],
                            ...data.map(item => [item.key, item.value])
                        ],
                    },
                },
            ],
            styles: {
                header: {
                    fontSize: 18,
                    bold: true,
                    margin: [0, 0, 0, 10] as [number, number, number, number],
                },
            },
        };

        const pdfDoc = pdfMake.createPdf(docDefinition);

        return new Promise<Buffer>((resolve, reject) => {
            pdfDoc.getBuffer((buffer: Uint8Array) => {
                 try {
                     const nodeBuffer = Buffer.from(buffer); // Conversión explícita
                     resolve(nodeBuffer);
                 } catch (err) {
                     reject(err);
                 }
            });
        });
    }

    private async generateExcel(data: ReportData[], sheetName: string): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(sheetName);

        worksheet.columns = [
            { header: 'Campo', key: 'key', width: 30 },
            { header: 'Valor', key: 'value', width: 50 },
        ];

        data.forEach(item => {
            worksheet.addRow({
                key: item.key,
                value: item.value
            });
        });

        return workbook.xlsx.writeBuffer() as Promise<Buffer>;
    }

    /**
     * Convierte una URL de imagen a base64
     */
    private async imageUrlToBase64(url: string): Promise<string | null> {
        try {
            console.log(`[PDF] Descargando imagen desde: ${url}`);
            const https = require('https');
            const http = require('http');
            
            return new Promise((resolve, reject) => {
                const protocol = url.startsWith('https:') ? https : http;
                
                protocol.get(url, (response: any) => {
                    if (response.statusCode !== 200) {
                        console.error(`[PDF] Error descargando imagen: ${response.statusCode}`);
                        resolve(null);
                        return;
                    }
                    
                    const chunks: Buffer[] = [];
                    response.on('data', (chunk: Buffer) => chunks.push(chunk));
                    response.on('end', () => {
                        try {
                            const buffer = Buffer.concat(chunks);
                            const base64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
                            console.log(`[PDF] Imagen convertida a base64: ${base64.substring(0, 50)}...`);
                            resolve(base64);
                        } catch (err) {
                            console.error(`[PDF] Error convirtiendo imagen a base64:`, err);
                            resolve(null);
                        }
                    });
                }).on('error', (err: any) => {
                    console.error(`[PDF] Error descargando imagen:`, err);
                    resolve(null);
                });
            });
        } catch (error) {
            console.error(`[PDF] Error en imageUrlToBase64:`, error);
            return null;
        }
    }

    /**
     * Genera PDF profesional para cotización con diseño personalizado
     */
    private async generateQuotationPDF(products: any[], customerInfo?: any): Promise<Buffer> {
        // Cargar imágenes del footer
        const utilsPath = path.join(process.cwd(), 'src', 'utils');
        let leftImageBase64 = '';
        let rightImageBase64 = '';

        try {
            const leftImagePath = path.join(utilsPath, 'libamaq-izquierda.png');
            if (fs.existsSync(leftImagePath)) {
                const leftImageBuffer = fs.readFileSync(leftImagePath);
                leftImageBase64 = `data:image/png;base64,${leftImageBuffer.toString('base64')}`;
            }

            const rightImagePath = path.join(utilsPath, 'libamaq-derecha.png');
            if (fs.existsSync(rightImagePath)) {
                const rightImageBuffer = fs.readFileSync(rightImagePath);
                rightImageBase64 = `data:image/png;base64,${rightImageBuffer.toString('base64')}`;
            }
        } catch (error) {
            console.error('Error loading footer images:', error);
        }
        const currentDate = new Date().toLocaleDateString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        // Calcular totales
        const subtotal = products.reduce((sum, product) => sum + (parseFloat(product.price || '0') * (product.quantity || 1)), 0);
        const iva = subtotal * 0.16;
        const total = subtotal + iva;

        // Convertir imágenes de productos a base64
        console.log(`[PDF] Iniciando conversión de imágenes para ${products.length} productos`);
        for (let i = 0; i < products.length; i++) {
            if (products[i].image_url) {
                console.log(`[PDF] Convirtiendo imagen del producto ${i + 1}: ${products[i].image_url}`);
                const base64Image = await this.imageUrlToBase64(products[i].image_url);
                if (base64Image) {
                    products[i].image_base64 = base64Image;
                    console.log(`[PDF] Imagen ${i + 1} convertida exitosamente`);
                } else {
                    console.log(`[PDF] No se pudo convertir imagen ${i + 1}`);
                }
            }
        }

        // Construir contenido dinámico de productos
        const productContent: any[] = [];

        products.forEach((product, index) => {
            const quantity = product.quantity || 1;
            const price = parseFloat(product.price || '0');
            const productTotal = price * quantity;

            // Log para debuggear imagen
            console.log(`[PDF] Producto ${index + 1}: ${product.name}`);
            console.log(`[PDF] Image URL: ${product.image_url || 'No image'}`);
            
            // Agregar nombre del producto
            productContent.push({
                text: `${product.name || 'Producto sin nombre'}`,
                style: 'productTitle',
                margin: [0, index > 0 ? 20 : 10, 0, 5]
            });

            // Crear tabla de especificaciones si existen
            const specs: any[] = [];
            if (product.description) {
                specs.push(['Descripción:', product.description]);
            }
            if (product.code) {
                specs.push(['Código:', product.code]);
            }
            if (product.category) {
                specs.push(['Categoría:', product.category]);
            }
            if (product.brand) {
                specs.push(['Marca:', product.brand]);
            }

            // Layout de tres columnas: imagen, especificaciones y precio
            const columns: any[] = [];

            // Columna de imagen (si existe)
            if (product.image_base64) {
                try {
                    console.log(`[PDF] Agregando imagen base64 al PDF: ${product.image_base64.substring(0, 50)}...`);
                    columns.push({
                        width: '25%',
                        stack: [
                            {
                                image: product.image_base64,
                                width: 80,
                                height: 80,
                                fit: [80, 80],
                                alignment: 'center',
                                margin: [0, 5, 0, 0]
                            }
                        ]
                    });
                    console.log(`[PDF] Imagen base64 agregada exitosamente al PDF`);
                } catch (error) {
                    console.error(`[PDF] Error agregando imagen base64: ${error.message}`);
                    // Agregar placeholder de imagen
                    columns.push({
                        width: '25%',
                        stack: [
                            {
                                text: '📸\nImagen no disponible',
                                alignment: 'center',
                                fontSize: 10,
                                color: '#999999',
                                margin: [0, 20, 0, 0]
                            }
                        ]
                    });
                }
            } else if (product.image_url) {
                // Si no se pudo convertir a base64, mostrar placeholder
                console.log(`[PDF] No hay imagen base64, mostrando placeholder para: ${product.image_url}`);
                columns.push({
                    width: '25%',
                    stack: [
                        {
                            text: '📸\nImagen no disponible',
                            alignment: 'center',
                            fontSize: 10,
                            color: '#999999',
                            margin: [0, 20, 0, 0]
                        }
                    ]
                });
            }

            // Columna de especificaciones
            columns.push({
                width: product.image_url ? '45%' : '60%',
                stack: [
                    specs.length > 0 ? {
                        text: 'ESPECIFICACIONES:',
                        style: 'specHeader',
                        margin: [0, 0, 0, 5]
                    } : {},
                    specs.length > 0 ? {
                        table: {
                            widths: ['30%', '70%'],
                            body: specs
                        },
                        layout: 'noBorders',
                        margin: [0, 0, 0, 10]
                    } : {},
                    {
                        text: `Cantidad: ${quantity}`,
                        style: 'normalText',
                        margin: [0, 5, 0, 0]
                    }
                ]
            });

            // Columna de precio
            columns.push({
                width: '30%',
                stack: [
                    {
                        text: `$${price.toLocaleString('es-MX', { minimumFractionDigits: 2 })} neto`,
                        style: 'priceText',
                        alignment: 'right',
                        margin: [0, 0, 0, 5]
                    },
                    {
                        text: `Subtotal: $${productTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
                        style: 'subtotalText',
                        alignment: 'right'
                    }
                ]
            });

            productContent.push({
                columns: columns
            });

            // Línea separadora
            if (index < products.length - 1) {
                productContent.push({
                    canvas: [
                        {
                            type: 'line',
                            x1: 0, y1: 0,
                            x2: 515, y2: 0,
                            lineWidth: 0.5,
                            lineColor: '#cccccc'
                        }
                    ],
                    margin: [0, 10, 0, 0]
                });
            }
        });

        const docDefinition: TDocumentDefinitions = {
            pageSize: 'LETTER',
            pageMargins: [40, 60, 40, 80],
            content: [
                // Header principal
                {
                    text: 'COTIZACION',
                    style: 'mainTitle',
                    alignment: 'left',
                    margin: [0, 0, 0, 10]
                },

                // Info del cliente y fecha
                {
                    columns: [
                        {
                            width: '50%',
                            stack: [
                                {
                                    text: 'CLIENTE:',
                                    style: 'clientLabel',
                                    margin: [0, 10, 0, 2]
                                },
                                {
                                    text: `${customerInfo?.name || 'Cliente'}`,
                                    style: 'clientName'
                                }
                            ]
                        },
                        {
                            width: '50%',
                            stack: [
                                {
                                    text: `FECHA: ${currentDate}`,
                                    style: 'dateText',
                                    alignment: 'right'
                                }
                            ]
                        }
                    ],
                    margin: [0, 0, 0, 30]
                },

                // Contenido de productos dinámico
                ...productContent,

                // Precio sujeto a cambio con icono de advertencia
                {
                    columns: [
                        { width: '65%', text: '' },
                        {
                            width: '35%',
                            stack: [
                                {
                                    columns: [
                                        {
                                            width: 'auto',
                                            text: '⚠️',
                                            fontSize: 14,
                                            margin: [0, 0, 5, 0]
                                        },
                                        {
                                            width: '*',
                                            text: 'Precio sujeto a cambio sin previo aviso',
                                            style: 'warningText'
                                        }
                                    ]
                                }
                            ]
                        }
                    ],
                    margin: [0, 15, 0, 15]
                },

                // Resumen de totales
                {
                    table: {
                        widths: ['70%', '30%'],
                        body: [
                            [
                                { text: 'Subtotal:', style: 'totalLabel', border: [false, false, false, false] },
                                { text: `$${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, style: 'totalValue', border: [false, false, false, false] }
                            ],
                            [
                                { text: 'IVA (16%):', style: 'totalLabel', border: [false, false, false, false] },
                                { text: `$${iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, style: 'totalValue', border: [false, false, false, false] }
                            ],
                            [
                                { text: 'TOTAL:', style: 'finalTotal', border: [false, true, false, false] },
                                { text: `$${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, style: 'finalTotal', border: [false, true, false, false] }
                            ]
                        ]
                    },
                    layout: {
                        hLineWidth: function(i: number, node: any) {
                            return (i === node.table.body.length) ? 2 : 0;
                        },
                        vLineWidth: function() { return 0; }
                    },
                    alignment: 'right',
                    margin: [300, 20, 0, 0]
                },

                // Condiciones
                {
                    text: 'CONDICIONES COMERCIALES',
                    style: 'conditionsTitle',
                    margin: [0, 30, 0, 10]
                },
                {
                    ul: [
                        'Vigencia: 30 días a partir de la fecha de emisión',
                        'Forma de Pago: Por definir con el cliente',
                        'Tiempo de Entrega: Por confirmar según disponibilidad',
                        'Los precios incluyen IVA',
                        'Garantía según términos del fabricante'
                    ],
                    style: 'conditionsList'
                }
            ],
            footer: function(currentPage: number, pageCount: number) {
                const footerContent: any[] = [];
                
                if (leftImageBase64 || rightImageBase64) {
                    const columns: any[] = [];
                    
                    if (leftImageBase64) {
                        columns.push({
                            image: leftImageBase64,
                            fit: [150, 45],
                            alignment: 'left' as any
                        });
                    }
                    
                    if (rightImageBase64) {
                        columns.push({
                            image: rightImageBase64,
                            fit: [150, 45],
                            alignment: 'right' as any
                        });
                    }
                    
                    if (columns.length > 0) {
                        footerContent.push({
                            columns: columns,
                            margin: [40, 10, 40, 0] as any
                        });
                    }
                }
                
                return footerContent;
            },
            styles: {
                mainTitle: {
                    fontSize: 36,
                    bold: true,
                    color: '#000000'
                },
                clientLabel: {
                    fontSize: 11,
                    bold: true,
                    color: '#000000'
                },
                clientName: {
                    fontSize: 12,
                    bold: false,
                    color: '#000000'
                },
                dateText: {
                    fontSize: 11,
                    bold: false,
                    color: '#000000'
                },
                productTitle: {
                    fontSize: 14,
                    bold: true,
                    color: '#000000',
                    decoration: 'underline'
                },
                specHeader: {
                    fontSize: 11,
                    bold: true,
                    color: '#000000'
                },
                normalText: {
                    fontSize: 10,
                    color: '#000000'
                },
                priceText: {
                    fontSize: 16,
                    bold: true,
                    color: '#000000'
                },
                subtotalText: {
                    fontSize: 11,
                    color: '#666666'
                },
                warningText: {
                    fontSize: 9,
                    color: '#e67e22',
                    italics: true
                },
                totalLabel: {
                    fontSize: 12,
                    alignment: 'right',
                    color: '#000000'
                },
                totalValue: {
                    fontSize: 12,
                    bold: true,
                    alignment: 'right',
                    color: '#000000'
                },
                finalTotal: {
                    fontSize: 16,
                    bold: true,
                    color: '#000000',
                    alignment: 'right'
                },
                conditionsTitle: {
                    fontSize: 12,
                    bold: true,
                    color: '#000000'
                },
                conditionsList: {
                    fontSize: 9,
                    color: '#333333'
                }
            }
        };

        const pdfDoc = pdfMake.createPdf(docDefinition);

        return new Promise<Buffer>((resolve, reject) => {
            pdfDoc.getBuffer((buffer: Uint8Array) => {
                try {
                    const nodeBuffer = Buffer.from(buffer);
                    resolve(nodeBuffer);
                } catch (err) {
                    reject(err);
                }
            });
        });
    }

    /**
     * Genera un buffer de PDF o Excel para una cotización.
     * Ya no envía directamente, solo genera el archivo.
     */
    async generateQuotation(
        products: any[],
        format: 'pdf' | 'excel' = 'pdf',
        customerInfo?: any
    ): Promise<{ success: boolean; data?: Buffer; error?: string }> {
        try {
            if (!products || products.length === 0) {
                return { success: false, error: 'No hay productos para cotizar' };
            }

            let fileBuffer: Buffer;
            if (format === 'pdf') {
                console.log('[PDF] Generando cotización en PDF...');
                fileBuffer = await this.generateQuotationPDF(products, customerInfo);
            } else {
                // Lógica para generar Excel (si es necesaria en el futuro)
                return { success: false, error: 'Formato Excel no implementado para cotizaciones' };
            }
            
            return { success: true, data: fileBuffer };

        } catch (error) {
            console.error('Error en generateQuotation:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido al generar la cotización.';
            return { success: false, error: errorMessage };
        }
    }

    private generateOrderMessage(order: Order): string {
        let message = stringConstants.ORDER_HEADER(order.id);
        return message;
    }
}