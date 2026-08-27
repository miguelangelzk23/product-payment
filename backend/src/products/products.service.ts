import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene la lista completa de productos junto con su disponibilidad de inventario (Stock)
   */
  async findAll() {
    return this.prisma.product.findMany({
      include: {
        stock: {
          select: {
            quantity: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Obtiene el detalle de un producto por su ID
   */
  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        stock: {
          select: {
            quantity: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID "${id}" no encontrado`);
    }

    return product;
  }
}
