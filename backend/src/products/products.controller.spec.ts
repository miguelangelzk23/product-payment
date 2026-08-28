import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: ProductsService;

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
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([mockProduct]),
            findOne: jest.fn().mockResolvedValue(mockProduct),
          },
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of products', async () => {
      const result = await controller.findAll();
      expect(result).toEqual([mockProduct]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single product by ID', async () => {
      const result = await controller.findOne(mockProduct.id);
      expect(result).toEqual(mockProduct);
      expect(service.findOne).toHaveBeenCalledWith(mockProduct.id);
    });
  });
});
