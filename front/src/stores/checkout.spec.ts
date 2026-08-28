import { setActivePinia, createPinia } from 'pinia';
import { useCheckoutStore } from './checkout';
import { api } from '../services/api';
import { describe, beforeEach, it, expect, vi } from 'vitest';

vi.mock('../services/api', () => {
  return {
    api: {
      get: vi.fn(),
      post: vi.fn(),
    },
  };
});

describe('Checkout Store', () => {
  const mockProduct = {
    id: 'prod-1',
    name: 'Teclado mecánico',
    description: 'Teclado...',
    priceInCents: 32900000,
    stock: { quantity: 12 },
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('initializes with default values', () => {
    const store = useCheckoutStore();
    expect(store.step).toBe(1);
    expect(store.selectedProduct).toBeNull();
    expect(store.loading).toBe(false);
    expect(store.isCheckoutModalOpen).toBe(false);
  });

  it('calculates totals correctly', () => {
    const store = useCheckoutStore();
    store.selectedProduct = mockProduct;
    store.quantity = 1;
    expect(store.productAmountInCents).toBe(32900000);
    expect(store.totalAmountInCents).toBe(32900000 + store.baseFeeInCents + store.deliveryFeeInCents);
  });

  it('correctly identifies card brand', () => {
    const store = useCheckoutStore();
    store.cardInfo.cardNumber = '4242 4242 4242 4242';
    expect(store.cardBrand).toBe('Visa');
    store.cardInfo.cardNumber = '5100 0000 0000 0000';
    expect(store.cardBrand).toBe('Mastercard');
    store.cardInfo.cardNumber = '1234 5678 9012 3456';
    expect(store.cardBrand).toBe('Tarjeta');
  });

  it('fetches products successfully', async () => {
    const store = useCheckoutStore();
    vi.mocked(api.get).mockResolvedValue({ data: [mockProduct] });

    await store.fetchProducts();

    expect(store.products).toEqual([mockProduct]);
    expect(api.get).toHaveBeenCalledWith('/products');
    expect(store.loading).toBe(false);
  });

  it('updates selectedProduct on fetch if already selected', async () => {
    const store = useCheckoutStore();
    store.selectedProduct = mockProduct;
    const updatedProduct = { ...mockProduct, priceInCents: 30000000 };
    vi.mocked(api.get).mockResolvedValue({ data: [updatedProduct] });

    await store.fetchProducts();

    expect(store.selectedProduct).toEqual(updatedProduct);
  });

  it('resets checkout successfully', async () => {
    const store = useCheckoutStore();
    store.step = 3;
    store.isCheckoutModalOpen = true;
    store.cardInfo.cardNumber = '4242';
    store.selectedProduct = mockProduct;
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    await store.resetCheckout();

    expect(store.step).toBe(1);
    expect(store.isCheckoutModalOpen).toBe(false);
    expect(store.cardInfo.cardNumber).toBe('');
    expect(store.selectedProduct).toBeNull();
  });

  it('processes payment successfully when response is APPROVED', async () => {
    const store = useCheckoutStore();
    store.selectedProduct = mockProduct;
    store.deliveryInfo = {
      email: 'test@example.com',
      fullName: 'Test User',
      phoneNumber: '3001234567',
      documentType: 'CC',
      documentNumber: '12345',
      addressLine: 'Calle 1',
      city: 'Bogota',
      region: 'Cund',
    };

    const response = {
      data: {
        data: {
          status: 'APPROVED',
          id: 'wompi-id-123',
        },
      },
    };
    vi.mocked(api.post).mockResolvedValue(response);

    await store.processPayment();

    expect(api.post).toHaveBeenCalledWith('/wompi/pay', expect.objectContaining({
      productId: 'prod-1',
      customerEmail: 'test@example.com',
    }));
    expect(store.transactionResult?.status).toBe('APPROVED');
    expect(store.step).toBe(4);
  });

  it('handles decline/error responses during payment', async () => {
    const store = useCheckoutStore();
    store.selectedProduct = mockProduct;
    vi.mocked(api.post).mockRejectedValue({
      response: {
        data: {
          message: 'Error en fondos',
        },
      },
    });

    await store.processPayment();

    expect(store.transactionResult?.status).toBe('ERROR');
    expect(store.transactionResult?.errorMessage).toBe('Error en fondos');
    expect(store.step).toBe(4);
  });
});
