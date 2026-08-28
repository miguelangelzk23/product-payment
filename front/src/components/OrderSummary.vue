<script setup lang="ts">
import { computed } from 'vue';
import { useCheckoutStore } from '../stores/checkout';

const store = useCheckoutStore();

const formatCurrency = (amountInCents: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amountInCents / 100);
};

const maskedCard = computed(() => {
  const num = store.cardInfo.cardNumber.replace(/\s+/g, '');
  if (num.length >= 4) {
    return `•••• •••• •••• ${num.slice(-4)}`;
  }
  return '••••';
});

const handleConfirmPay = () => {
  store.processPayment();
};
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-8">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-100 pb-5">
        <div>
          <h2 class="text-2xl font-bold text-slate-900 tracking-tight">Resumen del Pedido</h2>
          <p class="text-sm text-slate-500 mt-1">Verifica los detalles de la compra antes de procesar el pago</p>
        </div>
        <button
          @click="store.setStep(2)"
          :disabled="store.loading"
          class="text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-50"
        >
          ← Modificar datos
        </button>
      </div>

      <!-- Item Preview Card -->
      <div v-if="store.selectedProduct" class="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col sm:flex-row items-center gap-5">
        <img
          :src="store.selectedProduct.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80'"
          :alt="store.selectedProduct.name"
          class="w-20 h-20 object-cover rounded-xl border border-slate-200 bg-white"
        />
        <div class="flex-1 text-center sm:text-left">
          <h4 class="font-bold text-slate-900 text-lg">{{ store.selectedProduct.name }}</h4>
          <p class="text-xs text-slate-500 mt-1">{{ store.selectedProduct.description }}</p>
          <span class="inline-block mt-2 text-xs font-medium text-slate-700 bg-white px-2.5 py-0.5 rounded border border-slate-200">
            Cantidad: {{ store.quantity }}
          </span>
        </div>
        <div class="text-right">
          <span class="text-xl font-bold text-slate-900">
            {{ formatCurrency(store.productAmountInCents) }}
          </span>
        </div>
      </div>

      <!-- Address & Card Summary -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span>📍</span> Envío
          </h4>
          <p class="text-sm font-bold text-slate-900">{{ store.deliveryInfo.fullName }}</p>
          <p class="text-xs text-slate-600 mt-1">{{ store.deliveryInfo.addressLine }}</p>
          <p class="text-xs text-slate-600">{{ store.deliveryInfo.city }}, {{ store.deliveryInfo.region }}</p>
          <p class="text-xs text-slate-600 mt-1">Teléfono: {{ store.deliveryInfo.phoneNumber }}</p>
        </div>

        <div class="bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span>💳</span> Método de Pago
          </h4>
          <p class="text-sm font-bold text-slate-900">{{ store.cardBrand }} ({{ maskedCard }})</p>
          <p class="text-xs text-slate-600 mt-1">Titular: {{ store.cardInfo.cardHolder }}</p>
          <p class="text-xs text-slate-600">Cuotas: {{ store.cardInfo.installments }}</p>
          <div class="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white text-slate-700 border border-slate-200">
            🔒 Procesamiento de pago seguro
          </div>
        </div>
      </div>

      <!-- Financial Breakdown Table -->
      <div class="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-3">
        <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Desglose del pago</h4>
        
        <div class="flex justify-between text-sm text-slate-600">
          <span>Subtotal del producto:</span>
          <span class="font-medium text-slate-900">{{ formatCurrency(store.productAmountInCents) }}</span>
        </div>

        <div class="flex justify-between text-sm text-slate-600">
          <span>Tarifa base de servicio:</span>
          <span class="font-medium text-slate-900">{{ formatCurrency(store.baseFeeInCents) }}</span>
        </div>

        <div class="flex justify-between text-sm text-slate-600">
          <span>Envío a domicilio:</span>
          <span class="font-medium text-slate-900">{{ formatCurrency(store.deliveryFeeInCents) }}</span>
        </div>

        <div class="border-t border-slate-200 pt-4 mt-2 flex justify-between items-baseline">
          <span class="text-base font-bold text-slate-900">Total a Pagar:</span>
          <span class="text-3xl font-black text-slate-900 tracking-tight">
            {{ formatCurrency(store.totalAmountInCents) }}
          </span>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="store.error" class="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-medium">
        {{ store.error }}
      </div>

      <!-- Action Button -->
      <div class="pt-2 flex justify-end">
        <button
          @click="handleConfirmPay"
          :disabled="store.loading"
          class="w-full md:w-auto px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base rounded-2xl shadow-sm transition duration-300 flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <div v-if="store.loading" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span v-else>Confirmar y Pagar {{ formatCurrency(store.totalAmountInCents) }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
