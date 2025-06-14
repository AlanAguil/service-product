import { Injectable } from '@nestjs/common';
import { ProductService } from '../product/product.service';
import { HandleException } from '../../common/exceptions/handler/handle.exception';
import { ConfigService } from '@nestjs/config';

interface ProductDescription {
  destacados?: string;
  [key: string]: any;
}

@Injectable()
export class ShareProductService {
  constructor(
    private readonly productService: ProductService,
    private readonly configService: ConfigService,
  ) {}

  async getProductShareData(id: number) {
    try {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      const product = await this.productService.findByIdAndActive(id);
      
      if (!product) {
        return {
          title: 'Producto no encontrado',
          description: 'Este producto ya no está disponible.',
          image: `${frontendUrl}/default-product.png`,
          url: `${frontendUrl}/productos`
        };
      }

      let description = product.shortDescription;
      if (typeof product.description === 'object' && product.description !== null) {
        const descObj = product.description as ProductDescription;
        description = descObj.destacados || product.shortDescription;
      }

      const imageUrl = product.media?.[0]?.url || `${frontendUrl}/default-product.png`;

      return {
        title: product.name,
        description,
        image: imageUrl,
        url: `${frontendUrl}/productos/${product.id}`
      };
    } catch (error) {
      HandleException.exception(error);
    }
  }
} 