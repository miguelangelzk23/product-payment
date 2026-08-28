import { Test, TestingModule } from '@nestjs/testing';
import { WompiService } from './wompi.service';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { of, throwError } from 'rxjs';
import { InternalServerErrorException } from '@nestjs/common';
import { PaymentRequestDto } from './dto/payment-request.dto';

describe('WompiService', () => {
  let service: WompiService;
  let httpService: HttpService;
  let prisma: PrismaService;

  const mockPaymentData: PaymentRequestDto = {
    amountInCents: 500000,
    currency: 'COP',
    customerEmail: 'test@example.com',
    cardNumber: '4242424242424242',
    cvc: '123',
    expMonth: '12',
    expYear: '30',
    cardHolder: 'JUAN PEREZ',
    installments: 1,
    productId: 'a0f7ea6a-360e-4b68-b7f2-c92c906a259c',
    customerFullName: 'Juan Perez',
    customerPhoneNumber: '3001234567',
    customerDocumentType: 'CC',
    customerDocumentNumber: '12345678',
    deliveryAddressLine: 'Calle 123',
    deliveryCity: 'Bogota',
    deliveryRegion: 'Cundinamarca',
  };

  const mockCustomer = {
    id: 'cust-12345',
    email: 'test@example.com',
    fullName: 'Juan Perez',
    phoneNumber: '3001234567',
    documentType: 'CC',
    documentNumber: '12345678',
  };

  const mockProduct = {
    id: 'a0f7ea6a-360e-4b68-b7f2-c92c906a259c',
    name: 'Teclado mecánico RGB 75%',
    priceInCents: 32900000,
  };

  const mockDbTransaction = {
    id: 'tx-db-uuid',
    reference: 'REF-123',
    status: 'APPROVED',
  };

  const mockHttpService = {
    get: jest.fn(),
    post: jest.fn(),
  };

  const mockPrismaService = {
    customer: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
    delivery: {
      create: jest.fn(),
    },
    stock: {
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WompiService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<WompiService>(WompiService);
    httpService = module.get<HttpService>(HttpService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateSignature', () => {
    it('should generate a SHA-256 signature', () => {
      const signature = service.generateSignature('REF-123', 50000, 'COP');
      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expect(signature.length).toBe(64); // SHA-256 length is 64 hex characters
    });
  });

  describe('getAcceptanceToken', () => {
    it('should return the acceptance token on success', async () => {
      const response = {
        data: {
          data: {
            presigned_acceptance: {
              acceptance_token: 'token-acceptance-xyz',
            },
          },
        },
      };
      mockHttpService.get.mockReturnValue(of(response));

      const token = await service.getAcceptanceToken();
      expect(token).toBe('token-acceptance-xyz');
      expect(httpService.get).toHaveBeenCalled();
    });

    it('should throw an InternalServerErrorException on gateway failure', async () => {
      mockHttpService.get.mockReturnValue(throwError(() => new Error('Wompi Offline')));
      await expect(service.getAcceptanceToken()).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('tokenizeCard', () => {
    it('should return card token id on success', async () => {
      const response = {
        data: {
          data: {
            id: 'card-token-xyz',
          },
        },
      };
      mockHttpService.post.mockReturnValue(of(response));

      const token = await service.tokenizeCard(mockPaymentData);
      expect(token).toBe('card-token-xyz');
      expect(httpService.post).toHaveBeenCalled();
    });

    it('should throw an InternalServerErrorException on serialization failure', async () => {
      mockHttpService.post.mockReturnValue(throwError(() => new Error('Error')));
      await expect(service.tokenizeCard(mockPaymentData)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getTransactionStatus', () => {
    it('should return the transaction response', async () => {
      const response = { data: { status: 'APPROVED' } };
      mockHttpService.get.mockReturnValue(of({ data: response }));

      const status = await service.getTransactionStatus('tx-id');
      expect(status).toEqual(response);
    });

    it('should throw an InternalServerErrorException on status check failure', async () => {
      mockHttpService.get.mockReturnValue(throwError(() => new Error('Status Error')));
      await expect(service.getTransactionStatus('tx-id')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('decrementStock', () => {
    it('should call prisma stock update to decrement quantity', async () => {
      mockPrismaService.stock.update.mockResolvedValue({ productId: 'prod-123', quantity: 9 });
      await service.decrementStock('prod-123', 2);
      expect(prisma.stock.update).toHaveBeenCalledWith({
        where: { productId: 'prod-123' },
        data: {
          quantity: {
            decrement: 2,
          },
        },
      });
    });

    it('should log error and catch exception if prisma stock update fails', async () => {
      mockPrismaService.stock.update.mockRejectedValue(new Error('Prisma error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await service.decrementStock('prod-123', 2);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('createTransaction', () => {
    beforeEach(() => {
      // Common mocks for transaction setup
      mockPrismaService.customer.findFirst.mockResolvedValue(mockCustomer);
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.transaction.create.mockResolvedValue(mockDbTransaction);
      mockPrismaService.delivery.create.mockResolvedValue({});
      mockPrismaService.stock.update.mockResolvedValue({});

      // Mock acceptance token and tokenize card calls in WompiService
      jest.spyOn(service, 'getAcceptanceToken').mockResolvedValue('acceptance-token');
      jest.spyOn(service, 'tokenizeCard').mockResolvedValue('card-token');
    });

    it('should successfully create approved transaction and decrement stock (Customer exists)', async () => {
      const gatewayResponse = {
        data: {
          id: 'wompi-tx-999',
          status: 'APPROVED',
          payment_method: {
            extra: {
              brand: 'VISA',
              last_four: '1111',
            },
          },
        },
      };
      mockHttpService.post.mockReturnValue(of({ data: gatewayResponse }));
      const decrementStockSpy = jest.spyOn(service, 'decrementStock').mockResolvedValue();

      const result = await service.createTransaction(mockPaymentData);

      expect(result).toEqual(gatewayResponse);
      expect(prisma.customer.findFirst).toHaveBeenCalled();
      expect(prisma.customer.create).not.toHaveBeenCalled();
      expect(prisma.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'APPROVED',
          providerTransactionId: 'wompi-tx-999',
        }),
      });
      expect(prisma.delivery.create).toHaveBeenCalled();
      expect(decrementStockSpy).toHaveBeenCalledWith(mockPaymentData.productId, 1);
    });

    it('should create customer first, then process transaction and decrement stock (Customer does not exist)', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(null);
      mockPrismaService.customer.create.mockResolvedValue(mockCustomer);

      const gatewayResponse = {
        data: {
          id: 'wompi-tx-999',
          status: 'APPROVED',
        },
      };
      mockHttpService.post.mockReturnValue(of({ data: gatewayResponse }));
      const decrementStockSpy = jest.spyOn(service, 'decrementStock').mockResolvedValue();

      await service.createTransaction(mockPaymentData);

      expect(prisma.customer.findFirst).toHaveBeenCalled();
      expect(prisma.customer.create).toHaveBeenCalled();
      expect(decrementStockSpy).toHaveBeenCalled();
    });

    it('should handle PENDING gateway status and poll for APPROVED status', async () => {
      const initialResponse = {
        data: {
          id: 'wompi-tx-pending',
          status: 'PENDING',
        },
      };
      mockHttpService.post.mockReturnValue(of({ data: initialResponse }));

      const pollResponse = {
        data: {
          id: 'wompi-tx-pending',
          status: 'APPROVED',
          payment_method: {
            extra: {
              brand: 'MASTERCARD',
              last_four: '4444',
            },
          },
        },
      };
      jest.spyOn(service, 'getTransactionStatus').mockResolvedValue(pollResponse);
      const decrementStockSpy = jest.spyOn(service, 'decrementStock').mockResolvedValue();

      const result = await service.createTransaction(mockPaymentData);

      expect(result).toEqual(pollResponse);
      expect(service.getTransactionStatus).toHaveBeenCalledWith('wompi-tx-pending');
      expect(prisma.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'APPROVED',
          cardBrand: 'MASTERCARD',
        }),
      });
      expect(decrementStockSpy).toHaveBeenCalled();
    });

    it('should handle persistent PENDING gateway status after polling', async () => {
      const initialResponse = {
        data: {
          id: 'wompi-tx-pending-forever',
          status: 'PENDING',
        },
      };
      mockHttpService.post.mockReturnValue(of({ data: initialResponse }));
      jest.spyOn(service, 'getTransactionStatus').mockResolvedValue(initialResponse);
      const decrementStockSpy = jest.spyOn(service, 'decrementStock').mockResolvedValue();

      const result = await service.createTransaction(mockPaymentData);

      expect(result).toEqual(initialResponse);
      expect(prisma.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'PENDING',
        }),
      });
      expect(decrementStockSpy).not.toHaveBeenCalled();
    }, 12000);

    it('should save transaction as DECLINED in DB if gateway fails/declines, and throw InternalServerErrorException', async () => {
      mockHttpService.post.mockReturnValue(throwError(() => ({
        response: {
          data: {
            message: 'Fondos insuficientes',
          },
        },
      })));
      const decrementStockSpy = jest.spyOn(service, 'decrementStock').mockResolvedValue();

      await expect(service.createTransaction(mockPaymentData)).rejects.toThrow(InternalServerErrorException);

      expect(prisma.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'DECLINED',
        }),
      });
      expect(prisma.delivery.create).toHaveBeenCalled();
      expect(decrementStockSpy).not.toHaveBeenCalled();
    });

    it('should throw exception if database write throws an error', async () => {
      const gatewayResponse = { data: { status: 'APPROVED' } };
      mockHttpService.post.mockReturnValue(of({ data: gatewayResponse }));
      mockPrismaService.transaction.create.mockRejectedValue(new Error('DB failure'));

      await expect(service.createTransaction(mockPaymentData)).rejects.toThrow(InternalServerErrorException);
    });
  });
});
