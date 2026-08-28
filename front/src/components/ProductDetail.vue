<script setup lang="ts">
import { onMounted } from 'vue';
import { useCheckoutStore } from '../stores/checkout';

const store = useCheckoutStore();

onMounted(() => {
  if (store.products.length === 0) {
    store.fetchProducts();
  }
  // Ensure quantity is set to 1 when detail mounts
  store.quantity = 1;
});

const formatCurrency = (amountInCents: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amountInCents / 100);
};

const handleBuyNow = () => {
  store.isCheckoutModalOpen = true;
};

const handleGoBack = () => {
  store.selectedProduct = null;
};
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8 md:py-12">
    <!-- Back Navigation Link -->
    <div class="mb-6">
      <button
        @click="handleGoBack"
        class="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-all font-bold text-xs"
      >
        <span>←</span>
        <span>Volver al Catálogo</span>
      </button>
    </div>

    <!-- State Loading -->
    <div v-if="store.loading" class="flex flex-col items-center justify-center py-20">
      <div class="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      <p class="mt-4 text-slate-500 text-xs font-semibold">Cargando...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="store.error" class="bg-white p-6 rounded-2xl border border-rose-200 text-center max-w-sm mx-auto shadow-sm">
      <h3 class="text-sm font-bold text-slate-900 mb-2">Error de conexión</h3>
      <p class="text-slate-600 text-xs mb-4">{{ store.error }}</p>
      <button
        @click="store.fetchProducts()"
        class="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition"
      >
        Reintentar
      </button>
    </div>

    <!-- Main Detail Layout (Minimalist & Fully Responsive) -->
    <div v-else-if="store.selectedProduct" class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
      
      <!-- Left side: Image Container -->
      <div class="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center justify-center min-h-[260px] md:min-h-[320px]">
        <img
          :src="store.selectedProduct.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'"
          :alt="store.selectedProduct.name"
          class="max-w-full max-h-72 object-contain"
        />
      </div>

      <!-- Right side: Information and Purchase -->
      <div class="flex flex-col justify-between py-2 space-y-6">
        <div class="space-y-4">
          <!-- Stock status -->
          <div>
            <span
              v-if="(store.selectedProduct.stock?.quantity ?? 0) > 0"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {{ store.selectedProduct.stock?.quantity }} unidades disponibles
            </span>
            <span
              v-else
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200"
            >
              Agotado
            </span>
          </div>

          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {{ store.selectedProduct.name }}
          </h1>
          <p class="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
            {{ store.selectedProduct.description }}
          </p>
        </div>

        <div class="border-t border-slate-100 pt-6 space-y-4">
          <div class="flex items-baseline justify-between">
            <span class="text-xs font-bold text-slate-500">Precio:</span>
            <span class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {{ formatCurrency(store.selectedProduct.priceInCents) }}
            </span>
          </div>

          <button
            @click="handleBuyNow"
            :disabled="(store.selectedProduct.stock?.quantity ?? 0) <= 0"
            class="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl transition duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span>Pagar con tarjeta</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
