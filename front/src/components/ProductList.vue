<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useCheckoutStore } from '../stores/checkout';

const store = useCheckoutStore();
const searchQuery = ref('');

onMounted(() => {
  if (store.products.length === 0) {
    store.fetchProducts();
  }
});

const formatCurrency = (amountInCents: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amountInCents / 100);
};

const filteredProducts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return store.products;
  return store.products.filter(product => {
    return product.name.toLowerCase().includes(query) ||
           product.description.toLowerCase().includes(query);
  });
});

const handleSelectProduct = (product: any) => {
  store.selectedProduct = product;
  store.quantity = 1;
};
</script>

<template>
  <div class="w-full">
    <!-- Header / Hero Segment (Minimalist) -->
    <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-6 border-b border-slate-200/60 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
      <div class="space-y-1">
        <h1 class="text-3xl font-extrabold tracking-tight text-slate-900">
          Nuestros Productos
        </h1>
        <p class="text-slate-500 text-xs sm:text-sm font-semibold">
          Selecciona un dispositivo para ver los detalles y proceder con el pago seguro.
        </p>
      </div>

      <!-- Search Bar -->
      <div class="relative w-full md:w-80">
        <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          🔍
        </span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar producto..."
          class="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition duration-300 shadow-sm"
        />
      </div>
    </div>

    <!-- Products Grid Section -->
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <!-- Loading State -->
      <div v-if="store.loading" class="flex flex-col items-center justify-center py-20">
        <div class="w-12 h-12 border-4 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
        <p class="mt-4 text-slate-500 text-sm font-semibold">Cargando catálogo...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="store.error" class="bg-white p-8 rounded-3xl border border-rose-200 text-center max-w-md mx-auto shadow-md">
        <div class="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
          !
        </div>
        <h3 class="text-xl font-bold text-slate-900 mb-2">Error de conexión</h3>
        <p class="text-slate-600 text-sm mb-6">{{ store.error }}</p>
        <button
          @click="store.fetchProducts()"
          class="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition duration-300"
        >
          Reintentar
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredProducts.length === 0" class="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 max-w-lg mx-auto p-8 shadow-sm">
        <div class="text-4xl mb-4">🔍</div>
        <h3 class="text-lg font-bold text-slate-900 mb-1">Sin resultados</h3>
        <p class="text-slate-500 text-xs">No encontramos productos que coincidan con tu búsqueda.</p>
      </div>

      <!-- Main Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div
          v-for="product in filteredProducts"
          :key="product.id"
          @click="handleSelectProduct(product)"
          class="group bg-white rounded-2xl border border-slate-200/80 hover:border-slate-900/40 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <!-- Product image container -->
          <div class="bg-slate-50 p-6 flex items-center justify-center relative min-h-[200px] border-b border-slate-100 overflow-hidden">
            <!-- Stock Badge overlay -->
            <div class="absolute top-3 right-3 z-10">
              <span
                v-if="(product.stock?.quantity ?? 0) > 0"
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Stock: {{ product.stock?.quantity }}
              </span>
              <span
                v-else
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-sm"
              >
                Agotado
              </span>
            </div>

            <img
              :src="product.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'"
              :alt="product.name"
              class="w-full max-h-40 object-contain group-hover:scale-105 transition-all duration-500 ease-out"
            />
          </div>

          <!-- Product Details Block -->
          <div class="p-5 flex-1 flex flex-col justify-between">
            <div class="space-y-2">
              <h3 class="font-extrabold text-sm text-slate-900 group-hover:text-slate-600 transition-colors line-clamp-1">
                {{ product.name }}
              </h3>
              <p class="text-slate-500 text-xs line-clamp-2 leading-relaxed font-medium">
                {{ product.description }}
              </p>
            </div>

            <div class="border-t border-slate-100 mt-4 pt-4 flex items-center justify-between">
              <div>
                <p class="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Precio</p>
                <p class="font-black text-sm text-slate-900">
                  {{ formatCurrency(product.priceInCents) }}
                </p>
              </div>
              
              <span class="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 group-hover:bg-slate-900 group-hover:text-white transition duration-300 flex items-center justify-center text-slate-600 text-xs shadow-sm font-bold">
                →
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
