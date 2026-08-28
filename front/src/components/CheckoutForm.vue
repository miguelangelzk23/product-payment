<script setup lang="ts">
import { ref } from 'vue';
import { useCheckoutStore } from '../stores/checkout';

const store = useCheckoutStore();
const errors = ref<Record<string, string>>({});

const validateForm = () => {
  errors.value = {};

  if (!store.deliveryInfo.email || !/\S+@\S+\.\S+/.test(store.deliveryInfo.email)) {
    errors.value.email = 'Correo electrónico inválido';
  }
  if (!store.deliveryInfo.fullName.trim()) {
    errors.value.fullName = 'Nombre completo requerido';
  }
  if (!store.deliveryInfo.phoneNumber.trim()) {
    errors.value.phoneNumber = 'Teléfono celular requerido';
  }
  if (!store.deliveryInfo.documentNumber.trim()) {
    errors.value.documentNumber = 'Número de documento requerido';
  }
  if (!store.deliveryInfo.addressLine.trim()) {
    errors.value.addressLine = 'Dirección de entrega requerida';
  }
  if (!store.deliveryInfo.city.trim()) {
    errors.value.city = 'Ciudad requerida';
  }

  const rawCard = store.cardInfo.cardNumber.replace(/\s+/g, '');
  if (!rawCard || rawCard.length < 15) {
    errors.value.cardNumber = 'Número de tarjeta de crédito inválido';
  }
  if (!store.cardInfo.cardHolder.trim()) {
    errors.value.cardHolder = 'Nombre del titular requerido';
  }
  if (!store.cardInfo.cvc || store.cardInfo.cvc.length < 3) {
    errors.value.cvc = 'CVC de 3 o 4 dígitos requerido';
  }

  return Object.keys(errors.value).length === 0;
};

const handleNext = () => {
  if (validateForm()) {
    store.setStep(3);
  }
};

const formatCardNumber = (event: Event) => {
  const input = event.target as HTMLInputElement;
  let value = input.value.replace(/\D/g, '');
  if (value.length > 16) value = value.slice(0, 16);
  const parts = value.match(/.{1,4}/g);
  store.cardInfo.cardNumber = parts ? parts.join(' ') : value;
};
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-8">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-100 pb-5">
        <div>
          <h2 class="text-2xl font-bold text-slate-900 tracking-tight">Información de Envío y Pago</h2>
          <p class="text-sm text-slate-500 mt-1">Ingresa los datos correspondientes para la entrega y facturación</p>
        </div>
        <button
          @click="store.setStep(1)"
          class="text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200"
        >
          ← Volver
        </button>
      </div>

      <form @submit.prevent="handleNext" class="space-y-8">
        <!-- Sección Envío -->
        <div class="space-y-4">
          <div class="flex items-center gap-2 border-b border-slate-100 pb-2">
            <span class="w-2 h-2 rounded-full bg-slate-900"></span>
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Dirección de Entrega</h3>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Nombre Completo *</label>
              <input
                v-model="store.deliveryInfo.fullName"
                type="text"
                placeholder="Ej. María Rodríguez"
                class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition text-sm"
              />
              <span v-if="errors.fullName" class="text-xs text-rose-600 mt-1 block font-medium">{{ errors.fullName }}</span>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Correo Electrónico *</label>
              <input
                v-model="store.deliveryInfo.email"
                type="email"
                placeholder="maria@ejemplo.com"
                class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition text-sm"
              />
              <span v-if="errors.email" class="text-xs text-rose-600 mt-1 block font-medium">{{ errors.email }}</span>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Teléfono Móvil *</label>
              <input
                v-model="store.deliveryInfo.phoneNumber"
                type="text"
                placeholder="3001234567"
                class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition text-sm"
              />
              <span v-if="errors.phoneNumber" class="text-xs text-rose-600 mt-1 block font-medium">{{ errors.phoneNumber }}</span>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Tipo</label>
                <select
                  v-model="store.deliveryInfo.documentType"
                  class="w-full bg-slate-50 border border-slate-300 rounded-xl px-2 py-3 text-slate-900 focus:outline-none focus:border-slate-900 text-sm font-medium"
                >
                  <option value="CC">CC</option>
                  <option value="CE">CE</option>
                  <option value="NIT">NIT</option>
                  <option value="PP">PP</option>
                </select>
              </div>
              <div class="col-span-2">
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Documento *</label>
                <input
                  v-model="store.deliveryInfo.documentNumber"
                  type="text"
                  placeholder="1098765432"
                  class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition text-sm"
                />
                <span v-if="errors.documentNumber" class="text-xs text-rose-600 mt-1 block font-medium">{{ errors.documentNumber }}</span>
              </div>
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Dirección de Entrega *</label>
              <input
                v-model="store.deliveryInfo.addressLine"
                type="text"
                placeholder="Calle 100 # 15-20 Apt 301"
                class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition text-sm"
              />
              <span v-if="errors.addressLine" class="text-xs text-rose-600 mt-1 block font-medium">{{ errors.addressLine }}</span>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Ciudad *</label>
              <input
                v-model="store.deliveryInfo.city"
                type="text"
                placeholder="Bogotá"
                class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition text-sm"
              />
              <span v-if="errors.city" class="text-xs text-rose-600 mt-1 block font-medium">{{ errors.city }}</span>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Departamento</label>
              <input
                v-model="store.deliveryInfo.region"
                type="text"
                placeholder="Cundinamarca"
                class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition text-sm"
              />
            </div>
          </div>
        </div>

        <!-- Sección Tarjeta de Crédito -->
        <div class="space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-2">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-slate-900"></span>
              <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Tarjeta de Crédito</h3>
            </div>
            <span class="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {{ store.cardBrand }}
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Número de Tarjeta *</label>
              <input
                :value="store.cardInfo.cardNumber"
                @input="formatCardNumber"
                type="text"
                placeholder="4242 4242 4242 4242"
                class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition font-mono text-sm tracking-wider"
              />
              <span v-if="errors.cardNumber" class="text-xs text-rose-600 mt-1 block font-medium">{{ errors.cardNumber }}</span>
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Titular de la Tarjeta *</label>
              <input
                v-model="store.cardInfo.cardHolder"
                type="text"
                placeholder="Nombre como aparece en la tarjeta"
                class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition uppercase text-sm"
              />
              <span v-if="errors.cardHolder" class="text-xs text-rose-600 mt-1 block font-medium">{{ errors.cardHolder }}</span>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Mes Exp. *</label>
                <input
                  v-model="store.cardInfo.expMonth"
                  type="text"
                  placeholder="08"
                  maxlength="2"
                  class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-center placeholder-slate-400 focus:outline-none focus:border-slate-900 transition font-mono text-sm"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Año Exp. *</label>
                <input
                  v-model="store.cardInfo.expYear"
                  type="text"
                  placeholder="28"
                  maxlength="2"
                  class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-center placeholder-slate-400 focus:outline-none focus:border-slate-900 transition font-mono text-sm"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1.5">CVC *</label>
                <input
                  v-model="store.cardInfo.cvc"
                  type="password"
                  placeholder="123"
                  maxlength="4"
                  class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-center placeholder-slate-400 focus:outline-none focus:border-slate-900 transition font-mono text-sm"
                />
                <span v-if="errors.cvc" class="text-xs text-rose-600 mt-1 block font-medium">{{ errors.cvc }}</span>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Cuotas</label>
                <select
                  v-model.number="store.cardInfo.installments"
                  class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-slate-900 text-sm font-medium"
                >
                  <option v-for="n in 12" :key="n" :value="n">{{ n }} cuota(s)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-slate-100 pt-6 flex justify-end">
          <button
            type="submit"
            class="w-full md:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-sm transition duration-300 flex items-center justify-center gap-2"
          >
            <span>Ver Resumen del Pedido</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
