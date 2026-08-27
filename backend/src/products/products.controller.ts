import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener el catálogo completo de productos con su stock' })
  @ApiResponse({ status: 200, description: 'Lista de productos obtenida exitosamente.' })
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener el detalle de un producto específico por su ID (UUID)' })
  @ApiParam({ name: 'id', description: 'ID del producto en formato UUID' })
  @ApiResponse({ status: 200, description: 'Detalle del producto encontrado.' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }
}
