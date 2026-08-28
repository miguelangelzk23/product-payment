<script setup lang="ts">
import { useCheckoutStore } from '../stores/checkout';

const store = useCheckoutStore();

const formatCurrency = (amountInCents?: number) => {
  if (!amountInCents) return '$0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amountInCents / 100);
};

const handleBackToStore = () => {
  store.resetCheckout();
};
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-12">
    <div class="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm text-center space-y-6">
      <!-- Aprobado -->
      <div v-if="store.transactionResult?.status === 'APPROVED'" class="space-y-4">
        <div class="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-sm animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 class="text-3xl font-black text-slate-900 tracking-tight">¡Compra Confirmada!</h2>
        <p class="text-slate-600 text-sm max-w-md mx-auto">Tu pago fue procesado con éxito. Hemos registrado tu pedido y estamos preparando el envío.</p>
      </div>

      <!-- Pendiente -->
      <div v-else-if="store.transactionResult?.status === 'PENDING'" class="space-y-4">
        <div class="w-20 h-20 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 class="text-3xl font-black text-slate-900 tracking-tight">Transacción Pendiente</h2>
        <p class="text-amber-700 text-sm max-w-md mx-auto">Tu pago se encuentra en proceso de aprobación por parte de la entidad bancaria. Puedes consultar el estado con la referencia enviada.</p>
      </div>

      <!-- Rechazado / Error -->
      <div v-else class="space-y-4">
        <div class="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-200 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 class="text-3xl font-black text-slate-900 tracking-tight">Pago no procesado</h2>
        <p class="text-rose-600 text-sm max-w-md mx-auto">{{ store.transactionResult?.errorMessage || 'No se pudo completar el pago con los datos de la tarjeta.' }}</p>
      </div>

      <!-- Receipt Box -->
      <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-left space-y-3">
        <div class="flex justify-between items-center text-sm border-b border-slate-200 pb-2.5">
          <span class="text-slate-500">Referencia del Pedido:</span>
          <span class="font-mono font-bold text-slate-900 text-xs sm:text-sm">{{ store.transactionResult?.reference || 'N/A' }}</span>
        </div>

        <div class="flex justify-between items-center text-sm border-b border-slate-200 pb-2.5">
          <span class="text-slate-500">ID de Transacción:</span>
          <span class="font-mono text-slate-700 text-xs sm:text-sm">{{ store.transactionResult?.id || 'N/A' }}</span>
        </div>

        <div class="flex justify-between items-center text-sm border-b border-slate-200 pb-2.5">
          <span class="text-slate-500">Monto Total:</span>
          <span class="font-bold text-slate-900 text-base">
            {{ formatCurrency(store.transactionResult?.amountInCents) }}
          </span>
        </div>

        <div class="flex justify-between items-center text-sm">
          <span class="text-slate-500">Estado del Pago:</span>
          <span
            :class="[
              'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider',
              store.transactionResult?.status === 'APPROVED'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : store.transactionResult?.status === 'PENDING'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            ]"
          >
            {{ store.transactionResult?.status }}
          </span>
        </div>
      </div>

      <!-- Action -->
      <div class="pt-2">
        <button
          @click="handleBackToStore"
          class="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-sm transition duration-300 flex items-center justify-center gap-2"
        >
          <span>Volver al Catálogo</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
