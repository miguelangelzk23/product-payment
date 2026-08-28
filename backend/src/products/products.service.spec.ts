import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  const mockProduct = {
    id: 'a0f7ea6a-360e-4b68-b7f2-c92c906a259c',
    name: 'Teclado mecánico RGB 75%',
    description: 'Teclado mecánico compacto...',
    priceInCents: 32900000,
    imageUrl: 'https://picsum.photos/seed/keyboard/600/600',
    createdAt: new Date(),
    updatedAt: new Date(),
    stock: { quantity: 12 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              findMany: jest.fn().mockResolvedValue([mockProduct]),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      const result = await service.findAll();
      expect(result).toEqual([mockProduct]);
      expect(prisma.product.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single product by ID if it exists', async () => {
      jest.spyOn(prisma.product, 'findUnique').mockResolvedValue(mockProduct);
      const result = await service.findOne(mockProduct.id);
      expect(result).toEqual(mockProduct);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: mockProduct.id },
        include: {
          stock: {
            select: {
              quantity: true,
            },
          },
        },
      });
    });

    it('should throw a NotFoundException if the product does not exist', async () => {
      jest.spyOn(prisma.product, 'findUnique').mockResolvedValue(null);
      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });
});
