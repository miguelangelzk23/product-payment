import { Test, TestingModule } from '@nestjs/testing';
import { WompiController } from './wompi.controller';
import { WompiService } from './wompi.service';
import { PaymentRequestDto } from './dto/payment-request.dto';

describe('WompiController', () => {
  let controller: WompiController;
  let service: WompiService;

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

  const mockTransactionResult = {
    status: 'APPROVED',
    data: {
      id: 'tx-12345',
      status: 'APPROVED',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WompiController],
      providers: [
        {
          provide: WompiService,
          useValue: {
            getTransactionStatus: jest.fn().mockResolvedValue(mockTransactionResult),
            createTransaction: jest.fn().mockResolvedValue(mockTransactionResult),
          },
        },
      ],
    }).compile();

    controller = module.get<WompiController>(WompiController);
    service = module.get<WompiService>(WompiService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTransactionStatus', () => {
    it('should return transaction status from service', async () => {
      const result = await controller.getTransactionStatus('tx-12345');
      expect(result).toEqual(mockTransactionResult);
      expect(service.getTransactionStatus).toHaveBeenCalledWith('tx-12345');
    });
  });

  describe('processPayment', () => {
    it('should call service and process payment', async () => {
      const result = await controller.processPayment(mockPaymentData);
      expect(result).toEqual(mockTransactionResult);
      expect(service.createTransaction).toHaveBeenCalledWith(mockPaymentData);
    });
  });
});
