import { Controller, Get, Param, Render } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ShareProductService } from './share-product.service';

@ApiTags('ShareProduct')
@Controller('share/product')
export class ShareProductController {
  constructor(private readonly shareProductService: ShareProductService) {}

  @Get(':id')
  @Render('product-share')
  @ApiOperation({ summary: 'Compartir producto' })
  @ApiResponse({ status: 200, description: 'Página de compartir producto generada exitosamente' })
  async shareProduct(@Param('id') id: number) {
    return await this.shareProductService.getProductShareData(id);
  }
} 