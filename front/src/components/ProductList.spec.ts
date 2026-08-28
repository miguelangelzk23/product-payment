import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ProductList from './ProductList.vue';
import { useCheckoutStore } from '../stores/checkout';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ProductList.vue', () => {
  const mockProducts = [
    {
      id: 'prod-1',
      name: 'Teclado mecánico RGB 75%',
      description: 'Teclado compacto...',
      priceInCents: 32900000,
      stock: { quantity: 12 },
    },
    {
      id: 'prod-2',
      name: 'Mouse inalámbrico',
      description: 'Mouse ergonómico...',
      priceInCents: 18500000,
      stock: { quantity: 0 },
    },
  ];

  let pinia: ReturnType<typeof createPinia>;
  let store: ReturnType<typeof useCheckoutStore>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    store = useCheckoutStore();
    store.products = mockProducts;
    store.loading = false;
    store.error = null;
    
    // Mock store fetchProducts to prevent real API calls
    store.fetchProducts = vi.fn().mockResolvedValue(undefined);
  });

  it('renders title and search input correctly', () => {
    const wrapper = mount(ProductList, {
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.text()).toContain('Nuestros Productos');
    expect(wrapper.find('input[placeholder="Buscar producto..."]').exists()).toBe(true);
  });

  it('renders products list with stock indicators', () => {
    const wrapper = mount(ProductList, {
      global: {
        plugins: [pinia],
      },
    });

    const items = wrapper.findAll('.group');
    expect(items.length).toBe(2);

    expect(wrapper.text()).toContain('Teclado mecánico RGB 75%');
    expect(wrapper.text()).toContain('Stock: 12');
    expect(wrapper.text()).toContain('Agotado');
  });

  it('filters products based on search query', async () => {
    const wrapper = mount(ProductList, {
      global: {
        plugins: [pinia],
      },
    });

    const input = wrapper.find('input[placeholder="Buscar producto..."]');
    await input.setValue('mouse');

    const items = wrapper.findAll('.group');
    expect(items.length).toBe(1);
    expect(wrapper.text()).toContain('Mouse inalámbrico');
    expect(wrapper.text()).not.toContain('Teclado mecánico');
  });

  it('sets selectedProduct when clicking on a product card', async () => {
    const wrapper = mount(ProductList, {
      global: {
        plugins: [pinia],
      },
    });

    const firstCard = wrapper.find('.group');
    await firstCard.trigger('click');

    expect(store.selectedProduct).toEqual(mockProducts[0]);
    expect(store.quantity).toBe(1);
  });

  it('displays loading state', () => {
    store.loading = true;
    const wrapper = mount(ProductList, {
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.text()).toContain('Cargando catálogo...');
  });

  it('displays error state with retry button', async () => {
    store.error = 'Error de prueba';
    store.products = [];

    const wrapper = mount(ProductList, {
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.text()).toContain('Error de conexión');
    expect(wrapper.text()).toContain('Error de prueba');
    
    const retryBtn = wrapper.find('button');
    await retryBtn.trigger('click');
    expect(store.fetchProducts).toHaveBeenCalled();
  });
});
