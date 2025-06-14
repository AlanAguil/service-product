import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { IaService } from './ia.service';
import { GenerateDescriptionDto } from './model/generate.description.dto';

@ApiTags('AI')
@Controller('ia')
export class IaController {
  constructor(private readonly iaService: IaService) {}

  @Post('generate-description')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate product description using AI' })
  @ApiBody({ type: GenerateDescriptionDto })
  @ApiResponse({ status: 200, description: 'Description generated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  generateDescription(@Body() generateDescriptionDto: GenerateDescriptionDto) {
    return this.iaService.generateProductDescription(generateDescriptionDto.query);
  }
}
