import { Controller, Get, Query, Param, Res } from '@nestjs/common';
import { ReportService } from './report.service';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import * as archiver from 'archiver';

@ApiTags('Reports')
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) { }

  @Get('sales')
  @ApiOperation({ summary: 'Obtener reportes de ventas en PDF y Excel' })
  @ApiResponse({ status: 200, description: 'Reportes generados exitosamente' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  async getSalesReports(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    const reports = await this.reportService.generateSalesReportByDateRange(
      new Date(startDate),
      new Date(endDate)
    );

    if (reports && reports.success && reports.data) {
      // --- Logs temporales para depuración ---
      console.log('Tipo de reports.data.pdf:', typeof reports.data.pdf, reports.data.pdf instanceof Buffer);
      console.log('Tipo de reports.data.excel:', typeof reports.data.excel, reports.data.excel instanceof Buffer);
      // --------------------------------------

      const archive = archiver('zip', { zlib: { level: 9 } });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="reporte_ventas_${startDate}_a_${endDate}.zip"`);

      archive.pipe(res);

      archive.append(reports.data.pdf, { name: 'reporte_ventas.pdf' });
      archive.append(reports.data.excel, { name: 'reporte_ventas.xlsx' });

      archive.finalize();
    } else {
      res.status(400).send(reports || { success: false, error: 'Error al generar reportes' });
    }
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Generar y enviar reporte individual de una venta por WhatsApp' })
  @ApiResponse({ status: 200, description: 'Reporte enviado exitosamente' })
  @ApiParam({ name: 'orderId', required: true, type: String })
  async getOrderReport(@Param('orderId') orderId: string) {
    return await this.reportService.generateAndSendOrderReport(orderId);
  }
} 