import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ProductDetail from './ProductDetail.vue';
import { useCheckoutStore } from '../stores/checkout';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ProductDetail.vue', () => {
  const mockProduct = {
    id: 'prod-1',
    name: 'Teclado mecánico RGB 75%',
    description: 'Teclado compacto...',
    priceInCents: 32900000,
    stock: { quantity: 12 },
  };

  let pinia: ReturnType<typeof createPinia>;
  let store: ReturnType<typeof useCheckoutStore>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    store = useCheckoutStore();
    store.selectedProduct = mockProduct;
  });

  it('renders selected product details correctly', () => {
    const wrapper = mount(ProductDetail, {
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.text()).toContain('Teclado mecánico RGB 75%');
    expect(wrapper.text()).toContain('Teclado compacto...');
    expect(wrapper.text()).toContain('12 unidades');
    expect(wrapper.text()).toContain('329.000');
  });

  it('navigates back to catalog on back button click', async () => {
    const wrapper = mount(ProductDetail, {
      global: {
        plugins: [pinia],
      },
    });

    const backBtn = wrapper.find('button.inline-flex'); // Back to catalog button
    await backBtn.trigger('click');

    expect(store.selectedProduct).toBeNull();
  });

  it('opens checkout modal on pay button click when stock is available', async () => {
    const wrapper = mount(ProductDetail, {
      global: {
        plugins: [pinia],
      },
    });

    const payBtn = wrapper.find('button.bg-slate-900'); // Pay button
    await payBtn.trigger('click');

    expect(store.isCheckoutModalOpen).toBe(true);
  });

  it('disables pay button and shows sold out state when stock is 0', () => {
    store.selectedProduct = {
      ...mockProduct,
      stock: { quantity: 0 },
    };

    const wrapper = mount(ProductDetail, {
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.text()).toContain('Agotado');
    const payBtn = wrapper.find('button.bg-slate-900');
    expect(payBtn.attributes('disabled')).toBeDefined();
  });

  it('displays error state with retry button', async () => {
    store.error = 'Error de prueba';
    store.selectedProduct = null;
    const fetchSpy = vi.spyOn(store, 'fetchProducts').mockResolvedValue(undefined);

    const wrapper = mount(ProductDetail, {
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.text()).toContain('Error de conexión');
    expect(wrapper.text()).toContain('Error de prueba');
    
    const retryBtn = wrapper.find('button');
    await retryBtn.trigger('click');
    expect(fetchSpy).toHaveBeenCalled();
  });
});
