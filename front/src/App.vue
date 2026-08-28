<script setup lang="ts">
import { useCheckoutStore } from './stores/checkout';
import ProductDetail from './components/ProductDetail.vue';
import CheckoutForm from './components/CheckoutForm.vue';
import OrderSummary from './components/OrderSummary.vue';
import OrderResult from './components/OrderResult.vue';

const store = useCheckoutStore();

const steps = [
  { id: 1, label: 'Producto' },
  { id: 2, label: 'Envío & Pago' },
  { id: 3, label: 'Resumen' },
  { id: 4, label: 'Confirmación' },
];
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
    <!-- Header Navbar -->
    <header class="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <!-- Store Brand -->
        <div class="flex items-center gap-3 cursor-pointer group" @click="store.setStep(1)">
          <div class="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-xl shadow-md group-hover:bg-emerald-600 transition duration-300">
            L
          </div>
          <div>
            <h1 class="font-black text-lg tracking-tight text-slate-900 leading-none">LUMINA</h1>
            <p class="text-[11px] text-slate-500 font-semibold mt-0.5 tracking-wider uppercase">Tienda Oficial</p>
          </div>
        </div>

        <!-- Progress Steps -->
        <nav class="flex items-center gap-2 sm:gap-3 overflow-x-auto max-w-full pb-1 sm:pb-0">
          <template v-for="(stepItem, index) in steps" :key="stepItem.id">
            <div
              :class="[
                'flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full transition duration-300',
                store.step === stepItem.id
                  ? 'bg-slate-900 text-white shadow-sm font-bold'
                  : store.step > stepItem.id
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500'
              ]"
            >
              <span
                :class="[
                  'w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold',
                  store.step === stepItem.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-600'
                ]"
              >
                {{ store.step > stepItem.id ? '✓' : stepItem.id }}
              </span>
              <span class="whitespace-nowrap">{{ stepItem.label }}</span>
            </div>
            <span v-if="index < steps.length - 1" class="text-slate-300 text-xs">/</span>
          </template>
        </nav>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1">
      <Transition name="fade" mode="out-in">
        <ProductDetail v-if="store.step === 1" />
        <CheckoutForm v-else-if="store.step === 2" />
        <OrderSummary v-else-if="store.step === 3" />
        <OrderResult v-else-if="store.step === 4" />
      </Transition>
    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
      <div class="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>© 2026 LUMINA Store. Todos los derechos reservados.</p>
        <div class="flex items-center gap-4 text-slate-500 font-medium">
          <span class="flex items-center gap-1">🔒 Encriptación SSL 256-bit</span>
          <span>•</span>
          <span>⚡ Envío Garantizado</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
