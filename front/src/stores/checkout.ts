import { defineStore } from 'pinia';
import { api } from '../services/api';

export interface Product {
  id: string;
  name: string;
  description: string;
  priceInCents: number;
  imageUrl?: string;
  stock?: {
    quantity: number;
  };
}

export interface DeliveryInfo {
  email: string;
  fullName: string;
  phoneNumber: string;
  documentType: 'CC' | 'CE' | 'NIT' | 'PP';
  documentNumber: string;
  addressLine: string;
  city: string;
  region: string;
}

export interface CardInfo {
  cardNumber: string;
  cardHolder: string;
  expMonth: string;
  expYear: string;
  cvc: string;
  installments: number;
}

export interface TransactionResult {
  status: 'APPROVED' | 'DECLINED' | 'PENDING' | 'ERROR' | null;
  reference?: string;
  id?: string;
  amountInCents?: number;
  errorMessage?: string;
}

export const useCheckoutStore = defineStore('checkout', {
  state: () => ({
    step: 1, // 1: Product, 2: Delivery & Card, 3: Summary, 4: Status
    loading: false,
    error: '' as string | null,
    products: [] as Product[],
    selectedProduct: null as Product | null,
    quantity: 1,

    // Fees in cents COP
    baseFeeInCents: 500000, // $5,000.00 COP
    deliveryFeeInCents: 1200000, // $12,000.00 COP

    deliveryInfo: {
      email: '',
      fullName: '',
      phoneNumber: '',
      documentType: 'CC',
      documentNumber: '',
      addressLine: '',
      city: '',
      region: '',
    } as DeliveryInfo,

    cardInfo: {
      cardNumber: '',
      cardHolder: '',
      expMonth: '08',
      expYear: '28',
      cvc: '',
      installments: 1,
    } as CardInfo,

    transactionResult: null as TransactionResult | null,
  }),

  getters: {
    productAmountInCents(state): number {
      if (!state.selectedProduct) return 0;
      return state.selectedProduct.priceInCents * state.quantity;
    },
    totalAmountInCents(state): number {
      if (!state.selectedProduct) return 0;
      return (
        state.selectedProduct.priceInCents * state.quantity +
        state.baseFeeInCents +
        state.deliveryFeeInCents
      );
    },
    cardBrand(state): string {
      const num = state.cardInfo.cardNumber.replace(/\s+/g, '');
      if (/^4/.test(num)) return 'Visa';
      if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[0-1]|2720)/.test(num)) return 'Mastercard';
      return 'Tarjeta';
    },
  },

  actions: {
    async fetchProducts() {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.get('/products');
        this.products = response.data;
        if (this.products.length > 0) {
          this.selectedProduct = this.products[0] || null;
        }
      } catch (err: any) {
        this.error = 'No se pudo cargar el producto desde el backend.';
        console.error(err);
      } finally {
        this.loading = false;
      }
    },

    setStep(newStep: number) {
      this.step = newStep;
    },

    async processPayment() {
      if (!this.selectedProduct) return;
      this.loading = true;
      this.error = null;

      try {
        const reference = `REF-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const payload = {
          amountInCents: this.totalAmountInCents,
          currency: 'COP',
          customerEmail: this.deliveryInfo.email,
          reference: reference,
          cardNumber: this.cardInfo.cardNumber.replace(/\s+/g, ''),
          cvc: this.cardInfo.cvc,
          expMonth: this.cardInfo.expMonth,
          expYear: this.cardInfo.expYear,
          cardHolder: this.cardInfo.cardHolder,
          installments: Number(this.cardInfo.installments),
        };

        const response = await api.post('/wompi/pay', payload);
        const data = response.data;

        const rawStatus = data?.data?.status || 'APPROVED';
        let mappedStatus: 'APPROVED' | 'DECLINED' | 'PENDING' = 'PENDING';

        if (rawStatus === 'APPROVED') {
          mappedStatus = 'APPROVED';
        } else if (rawStatus === 'PENDING') {
          mappedStatus = 'PENDING';
        } else {
          mappedStatus = 'DECLINED';
        }

        this.transactionResult = {
          status: mappedStatus,
          reference: reference,
          id: data?.data?.id || `TX-${Date.now()}`,
          amountInCents: this.totalAmountInCents,
        };

        this.step = 4; // Go to final status page
      } catch (err: any) {
        console.error('Error procesando pago:', err);
        this.transactionResult = {
          status: 'ERROR',
          errorMessage: err.response?.data?.message || 'Ocurrió un error al procesar el pago.',
        };
        this.step = 4;
      } finally {
        this.loading = false;
      }
    },

    async resetCheckout() {
      this.step = 1;
      this.transactionResult = null;
      this.cardInfo.cardNumber = '';
      this.cardInfo.cvc = '';
      this.cardInfo.cardHolder = '';
      await this.fetchProducts(); // Refresh stock for step 5 -> 1 return
    },
  },
});
