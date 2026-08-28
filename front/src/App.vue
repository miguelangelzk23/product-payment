<script setup lang="ts">
import { useCheckoutStore } from './stores/checkout';
import ProductList from './components/ProductList.vue';
import ProductDetail from './components/ProductDetail.vue';
import CheckoutModal from './components/CheckoutModal.vue';

const store = useCheckoutStore();
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
    <!-- Header Navbar -->
    <header class="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <!-- Store Brand -->
        <div class="flex items-center gap-3 cursor-pointer group" @click="store.resetCheckout">
          <div class="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-xl shadow-md group-hover:bg-emerald-600 transition duration-300">
            L
          </div>
          <div>
            <h1 class="font-black text-lg tracking-tight text-slate-900 leading-none">LUMINA</h1>
            <p class="text-[11px] text-slate-500 font-semibold mt-0.5 tracking-wider uppercase">Tienda Oficial</p>
          </div>
        </div>

        <!-- Security Badge -->
        <div class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600">
          <span>🔒</span>
          <span class="hidden sm:inline">Pago 100% Seguro</span>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1">
      <Transition name="fade" mode="out-in">
        <ProductList v-if="!store.selectedProduct" />
        <ProductDetail v-else />
      </Transition>
    </main>

    <!-- Checkout Modal Overlay -->
    <Transition name="modal-fade">
      <CheckoutModal v-if="store.isCheckoutModalOpen" />
    </Transition>

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
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Page fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
