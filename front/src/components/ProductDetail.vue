<script setup lang="ts">
import { onMounted } from 'vue';
import { useCheckoutStore } from '../stores/checkout';

const store = useCheckoutStore();

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

const handleBuyNow = () => {
  store.setStep(2);
};
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8 md:py-12">
    <!-- State Loading -->
    <div v-if="store.loading" class="flex flex-col items-center justify-center py-24">
      <div class="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      <p class="mt-4 text-slate-500 text-sm font-medium">Cargando catálogo...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="store.error" class="bg-white p-8 rounded-3xl border border-rose-200 text-center max-w-md mx-auto shadow-sm">
      <div class="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
        !
      </div>
      <h3 class="text-xl font-bold text-slate-900 mb-2">Error de conexión</h3>
      <p class="text-slate-600 text-sm mb-6">{{ store.error }}</p>
      <button
        @click="store.fetchProducts()"
        class="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition"
      >
        Reintentar
      </button>
    </div>

    <!-- Main Product Card -->
    <div v-else-if="store.selectedProduct" class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm">
      <!-- Product Image Showcase -->
      <div class="lg:col-span-6 relative group rounded-2xl bg-slate-50 p-8 border border-slate-100 flex items-center justify-center min-h-[320px]">
        <img
          :src="store.selectedProduct.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'"
          :alt="store.selectedProduct.name"
          class="w-full max-h-80 object-contain relative z-10 group-hover:scale-105 transition duration-500"
        />

        <!-- Stock Badge -->
        <div class="absolute top-4 right-4 z-20">
          <span
            v-if="(store.selectedProduct.stock?.quantity ?? 0) > 0"
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
          >
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            Disponible ({{ store.selectedProduct.stock?.quantity }} unidades)
          </span>
          <span
            v-else
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"
          >
            Agotado
          </span>
        </div>
      </div>

      <!-- Product Details & Purchase CTA -->
      <div class="lg:col-span-6 flex flex-col justify-between space-y-6">
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <span>Garantía Oficial</span>
          </div>
          <h1 class="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {{ store.selectedProduct.name }}
          </h1>
          <p class="text-slate-600 text-sm mt-4 leading-relaxed">
            {{ store.selectedProduct.description }}
          </p>
        </div>

        <div class="border-t border-slate-100 pt-6 space-y-6">
          <div class="flex items-baseline justify-between">
            <span class="text-sm font-medium text-slate-500">Precio de contado:</span>
            <div class="text-right">
              <span class="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {{ formatCurrency(store.selectedProduct.priceInCents) }}
              </span>
              <span class="block text-[11px] text-slate-400 font-medium">Impuestos incluidos</span>
            </div>
          </div>

          <button
            @click="handleBuyNow"
            :disabled="(store.selectedProduct.stock?.quantity ?? 0) <= 0"
            class="w-full py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-base rounded-2xl shadow-md transition duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <span>Iniciar Compra Segura</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>

          <div class="grid grid-cols-3 gap-2 text-center text-[12px] text-slate-600 border-t border-slate-100 pt-4 font-medium">
            <div class="flex flex-col items-center gap-1">
              <span>🚚 Envío Rápido</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <span>🛡️ Pago Encriptado</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <span>⚡ Garantía Total</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
