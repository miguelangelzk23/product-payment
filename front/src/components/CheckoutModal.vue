<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCheckoutStore } from '../stores/checkout';

const store = useCheckoutStore();
const activeStep = ref(1); // 1: Card Info, 2: Delivery & Summary
const errors = ref<Record<string, string>>({});

// Format currency helper
const formatCurrency = (amountInCents: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amountInCents / 100);
};

// Masked card computed for summary
const maskedCard = computed(() => {
  const num = store.cardInfo.cardNumber.replace(/\s+/g, '');
  if (num.length >= 4) {
    return `•••• •••• •••• ${num.slice(-4)}`;
  }
  return '••••';
});

// Card number auto-spacing
const formatCardNumber = (event: Event) => {
  const input = event.target as HTMLInputElement;
  let value = input.value.replace(/\D/g, '');
  if (value.length > 16) value = value.slice(0, 16);
  const parts = value.match(/.{1,4}/g);
  store.cardInfo.cardNumber = parts ? parts.join(' ') : value;
};

// Expiry month validator & formatter
const handleMonthInput = (event: Event) => {
  const input = event.target as HTMLInputElement;
  let value = input.value.replace(/\D/g, '');
  if (value.length > 2) value = value.slice(0, 2);
  store.cardInfo.expMonth = value;
};

// Expiry year validator & formatter
const handleYearInput = (event: Event) => {
  const input = event.target as HTMLInputElement;
  let value = input.value.replace(/\D/g, '');
  if (value.length > 2) value = value.slice(0, 2);
  store.cardInfo.expYear = value;
};

// CVC formatter
const handleCvcInput = (event: Event) => {
  const input = event.target as HTMLInputElement;
  let value = input.value.replace(/\D/g, '');
  if (value.length > 4) value = value.slice(0, 4);
  store.cardInfo.cvc = value;
};

// Validation for Step 1: Card Info
const validateStep1 = () => {
  errors.value = {};
  const rawCard = store.cardInfo.cardNumber.replace(/\s+/g, '');
  
  if (!rawCard || rawCard.length < 15) {
    errors.value.cardNumber = 'Número de tarjeta inválido (15 o 16 dígitos)';
  }
  if (!store.cardInfo.cardHolder.trim()) {
    errors.value.cardHolder = 'Nombre del titular es requerido';
  }
  const month = parseInt(store.cardInfo.expMonth);
  if (!store.cardInfo.expMonth || isNaN(month) || month < 1 || month > 12) {
    errors.value.expMonth = 'Mes inválido (01-12)';
  }
  const year = parseInt(store.cardInfo.expYear);
  if (!store.cardInfo.expYear || isNaN(year) || year < 24) {
    errors.value.expYear = 'Año inválido';
  }
  if (!store.cardInfo.cvc || store.cardInfo.cvc.length < 3) {
    errors.value.cvc = 'CVC requerido (3 o 4 dígitos)';
  }

  return Object.keys(errors.value).length === 0;
};

// Validation for Step 2: Delivery Info
const validateStep2 = () => {
  errors.value = {};

  if (!store.deliveryInfo.fullName.trim()) {
    errors.value.fullName = 'Nombre completo requerido';
  }
  if (!store.deliveryInfo.email || !/\S+@\S+\.\S+/.test(store.deliveryInfo.email)) {
    errors.value.email = 'Correo electrónico inválido';
  }
  if (!store.deliveryInfo.phoneNumber.trim() || store.deliveryInfo.phoneNumber.length < 7) {
    errors.value.phoneNumber = 'Teléfono de contacto inválido';
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

  return Object.keys(errors.value).length === 0;
};

const goToStep2 = () => {
  if (validateStep1()) {
    activeStep.value = 2;
  }
};

const goBackToStep1 = () => {
  activeStep.value = 1;
};

const handleConfirmPayment = async () => {
  if (validateStep2()) {
    activeStep.value = 3; // Switch to loading/status step in modal UI
    await store.processPayment();
    activeStep.value = 4; // Switch to results step in modal UI
  }
};

const handleCloseModal = () => {
  store.resetCheckout();
  activeStep.value = 1;
};
</script>

<template>
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
    <!-- Backdrop Overlay with blur -->
    <div 
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
      @click="activeStep < 3 ? handleCloseModal() : null"
    ></div>

    <!-- Modal Container -->
    <div 
      class="relative bg-white w-full max-w-2xl rounded-3xl border border-slate-200/80 shadow-2xl z-10 overflow-hidden transition-all duration-300 flex flex-col my-8"
      :class="[activeStep === 3 ? 'max-w-md' : '']"
    >
      <!-- Close button (Hidden during payment processing) -->
      <button 
        v-if="activeStep < 3 || activeStep === 4"
        @click="handleCloseModal"
        class="absolute top-5 right-5 text-slate-400 hover:text-slate-900 transition p-1.5 rounded-full hover:bg-slate-100 z-20"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Step Progress Header (Hidden during processing & results) -->
      <div v-if="activeStep <= 2" class="px-6 sm:px-8 pt-8 pb-4 border-b border-slate-100">
        <h2 class="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <span>🛡️</span> Pago Seguro Wompi
        </h2>
        
        <!-- Steps indicator -->
        <div class="flex items-center gap-3 mt-4">
          <div class="flex items-center gap-1.5 text-xs font-bold transition">
            <span 
              class="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
              :class="[activeStep === 1 ? 'bg-slate-900 text-white' : 'bg-emerald-500 text-white']"
            >
              {{ activeStep > 1 ? '✓' : '1' }}
            </span>
            <span :class="[activeStep === 1 ? 'text-slate-900' : 'text-slate-500']">Tarjeta de Crédito</span>
          </div>
          <span class="text-slate-300 text-xs">/</span>
          <div class="flex items-center gap-1.5 text-xs font-bold transition">
            <span 
              class="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
              :class="[activeStep === 2 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500']"
            >
              2
            </span>
            <span :class="[activeStep === 2 ? 'text-slate-900' : 'text-slate-400']">Envío & Facturación</span>
          </div>
        </div>
      </div>

      <!-- Main Body -->
      <div class="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
        
        <!-- STEP 1: CARD DETAILS -->
        <div v-if="activeStep === 1" class="space-y-6">
          <div class="text-slate-500 text-sm">
            Ingresa la tarjeta con la cual deseas realizar tu compra. Tu información está protegida con encriptación SSL de 256 bits.
          </div>

          <!-- Dynamic Visual Card Preview (Minimalist & Premium) -->
          <div class="relative w-full h-44 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white p-5 shadow-lg flex flex-col justify-between overflow-hidden">
            <!-- Background pattern -->
            <div class="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12">
              <div class="w-48 h-48 rounded-full border-[20px] border-white"></div>
            </div>
            
            <div class="flex justify-between items-start">
              <div>
                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Lumina Store</p>
                <div class="w-8 h-6 bg-amber-400/80 rounded-md mt-2 flex items-center justify-center shadow-inner">
                  <div class="w-6 h-4 border border-amber-600/40 rounded"></div>
                </div>
              </div>
              <!-- Card type indicator -->
              <span class="text-xs font-bold uppercase px-3 py-1 bg-white/10 backdrop-blur rounded-lg border border-white/10">
                {{ store.cardBrand }}
              </span>
            </div>

            <div>
              <p class="font-mono text-base tracking-widest text-slate-100 min-h-[24px]">
                {{ store.cardInfo.cardNumber || '•••• •••• •••• ••••' }}
              </p>
              <div class="flex justify-between mt-4">
                <div>
                  <p class="text-[8px] text-slate-400 uppercase font-semibold">Titular</p>
                  <p class="text-xs uppercase font-medium tracking-wide truncate max-w-[200px] min-h-[16px]">
                    {{ store.cardInfo.cardHolder || 'NOMBRE TITULAR' }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-[8px] text-slate-400 uppercase font-semibold">Vence</p>
                  <p class="text-xs font-mono min-h-[16px]">
                    {{ store.cardInfo.expMonth || 'MM' }}/{{ store.cardInfo.expYear || 'AA' }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Card inputs -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Número de Tarjeta *</label>
              <input
                :value="store.cardInfo.cardNumber"
                @input="formatCardNumber"
                type="text"
                placeholder="4242 4242 4242 4242"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 transition font-mono text-sm tracking-wider"
              />
              <span v-if="errors.cardNumber" class="text-xs text-rose-600 mt-1 block font-medium">{{ errors.cardNumber }}</span>
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Nombre en la Tarjeta *</label>
              <input
                v-model="store.cardInfo.cardHolder"
                type="text"
                placeholder="Escribe el nombre del titular"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 transition uppercase text-sm"
              />
              <span v-if="errors.cardHolder" class="text-xs text-rose-600 mt-1 block font-medium">{{ errors.cardHolder }}</span>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <div class="col-span-1">
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Mes Exp. *</label>
                <input
                  v-model="store.cardInfo.expMonth"
                  @input="handleMonthInput"
                  type="text"
                  placeholder="MM"
                  maxlength="2"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-slate-900 text-center placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 transition font-mono text-sm"
                />
              </div>
              <div class="col-span-1">
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Año Exp. *</label>
                <input
                  v-model="store.cardInfo.expYear"
                  @input="handleYearInput"
                  type="text"
                  placeholder="AA"
                  maxlength="2"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-slate-900 text-center placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 transition font-mono text-sm"
                />
              </div>
              <div class="col-span-1">
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">CVC *</label>
                <input
                  v-model="store.cardInfo.cvc"
                  @input="handleCvcInput"
                  type="password"
                  placeholder="123"
                  maxlength="4"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-slate-900 text-center placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 transition font-mono text-sm"
                />
              </div>
              <div class="col-span-3 flex gap-2">
                <span v-if="errors.expMonth" class="text-xs text-rose-600 font-medium">{{ errors.expMonth }}</span>
                <span v-if="errors.expYear && !errors.expMonth" class="text-xs text-rose-600 font-medium">{{ errors.expYear }}</span>
                <span v-if="errors.cvc" class="text-xs text-rose-600 font-medium ml-auto">{{ errors.cvc }}</span>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Cuotas *</label>
              <select
                v-model.number="store.cardInfo.installments"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 transition text-sm font-medium h-[46px]"
              >
                <option v-for="n in 12" :key="n" :value="n">{{ n }} cuota(s)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- STEP 2: DELIVERY INFO & SUMMARY -->
        <div v-else-if="activeStep === 2" class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- Left side: Delivery Info Form -->
          <div class="lg:col-span-7 space-y-4">
            <h3 class="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-2">
              <span>📍</span> Datos de Envío
            </h3>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="sm:col-span-2">
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Nombre Completo *</label>
                <input
                  v-model="store.deliveryInfo.fullName"
                  type="text"
                  placeholder="Ej. María Rodríguez"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition text-sm"
                />
                <span v-if="errors.fullName" class="text-xs text-rose-600 mt-1 block font-medium">{{ errors.fullName }}</span>
              </div>

              <div class="sm:col-span-2">
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Correo Electrónico *</label>
                <input
                  v-model="store.deliveryInfo.email"
                  type="email"
                  placeholder="maria@ejemplo.com"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition text-sm"
                />
                <span v-if="errors.email" class="text-xs text-rose-600 mt-1 block font-medium">{{ errors.email }}</span>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Teléfono Móvil *</label>
                <input
                  v-model="store.deliveryInfo.phoneNumber"
                  type="text"
                  placeholder="3001234567"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition text-sm"
                />
                <span v-if="errors.phoneNumber" class="text-xs text-rose-600 mt-1 block font-medium">{{ errors.phoneNumber }}</span>
              </div>

              <div class="grid grid-cols-3 gap-1">
                <div class="col-span-1">
                  <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Tipo</label>
                  <select
                    v-model="store.deliveryInfo.documentType"
                    class="w-full bg-slate-50 border border-slate-200 rounded-xl px-1.5 py-2.5 text-slate-900 focus:outline-none focus:border-slate-900 text-sm font-medium h-[40px]"
                  >
                    <option value="CC">CC</option>
                    <option value="CE">CE</option>
                    <option value="NIT">NIT</option>
                    <option value="PP">PP</option>
                  </select>
                </div>
                <div class="col-span-2">
                  <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Documento *</label>
                  <input
                    v-model="store.deliveryInfo.documentNumber"
                    type="text"
                    placeholder="10987654"
                    class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition text-sm"
                  />
                </div>
                <span v-if="errors.documentNumber" class="col-span-3 text-xs text-rose-600 font-medium">{{ errors.documentNumber }}</span>
              </div>

              <div class="sm:col-span-2">
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Dirección de Entrega *</label>
                <input
                  v-model="store.deliveryInfo.addressLine"
                  type="text"
                  placeholder="Calle 100 # 15-20"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition text-sm"
                />
                <span v-if="errors.addressLine" class="text-xs text-rose-600 mt-1 block font-medium">{{ errors.addressLine }}</span>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Ciudad *</label>
                <input
                  v-model="store.deliveryInfo.city"
                  type="text"
                  placeholder="Bogotá"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition text-sm"
                />
                <span v-if="errors.city" class="text-xs text-rose-600 mt-1 block font-medium">{{ errors.city }}</span>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Departamento</label>
                <input
                  v-model="store.deliveryInfo.region"
                  type="text"
                  placeholder="Cundinamarca"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition text-sm"
                />
              </div>
            </div>
          </div>

          <!-- Right side: Purchase Summary -->
          <div class="lg:col-span-5 space-y-4">
            <h3 class="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-2">
              <span>🛒</span> Resumen
            </h3>
            
            <div class="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-4 text-xs">
              <!-- Item -->
              <div v-if="store.selectedProduct" class="flex gap-3">
                <img 
                  :src="store.selectedProduct.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80'" 
                  class="w-12 h-12 object-cover rounded-lg border border-slate-200 bg-white"
                />
                <div>
                  <h4 class="font-bold text-slate-900 text-sm line-clamp-1">{{ store.selectedProduct.name }}</h4>
                  <p class="text-[10px] text-slate-500 mt-0.5">Cant: {{ store.quantity }}</p>
                </div>
              </div>

              <hr class="border-slate-200" />

              <!-- Calculations -->
              <div class="space-y-2 text-slate-600">
                <div class="flex justify-between">
                  <span>Subtotal:</span>
                  <span class="font-semibold text-slate-900">{{ formatCurrency(store.productAmountInCents) }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Servicio seguro:</span>
                  <span class="font-semibold text-slate-900">{{ formatCurrency(store.baseFeeInCents) }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Envío:</span>
                  <span class="font-semibold text-slate-900">{{ formatCurrency(store.deliveryFeeInCents) }}</span>
                </div>
                <div class="flex justify-between text-slate-500">
                  <span>Pago con tarjeta:</span>
                  <span>{{ store.cardBrand }} •••• {{ store.cardInfo.cardNumber.slice(-4) }}</span>
                </div>
              </div>

              <hr class="border-slate-200" />

              <!-- Total -->
              <div class="flex justify-between items-baseline">
                <span class="text-sm font-bold text-slate-900">Total:</span>
                <span class="text-lg font-black text-slate-900">
                  {{ formatCurrency(store.totalAmountInCents) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- STEP 3: LOADING SCREEN -->
        <div v-else-if="activeStep === 3" class="py-12 flex flex-col items-center justify-center text-center space-y-6">
          <div class="w-16 h-16 border-4 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
          <div>
            <h3 class="text-lg font-extrabold text-slate-900">Procesando pago...</h3>
            <p class="text-slate-500 text-sm mt-2 max-w-xs mx-auto">
              Estamos validando tus datos y autorizando la transacción con la pasarela Wompi. Por favor no cierres esta ventana.
            </p>
          </div>
          <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-500">
            🔒 Transacción Encriptada SSL
          </div>
        </div>

        <!-- STEP 4: RESULT SCREEN -->
        <div v-else-if="activeStep === 4" class="space-y-6 py-4">
          <!-- Aprobado -->
          <div v-if="store.transactionResult?.status === 'APPROVED'" class="text-center space-y-4">
            <div class="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 class="text-2xl font-black text-slate-900 tracking-tight">¡Compra Exitosa!</h3>
              <p class="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
                Tu pago fue aprobado con éxito. Hemos registrado tu pedido y estamos preparando el envío a tu domicilio.
              </p>
            </div>
          </div>

          <!-- Pendiente -->
          <div v-else-if="store.transactionResult?.status === 'PENDING'" class="text-center space-y-4">
            <div class="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200 shadow-sm animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 class="text-2xl font-black text-slate-900 tracking-tight">Transacción Pendiente</h3>
              <p class="text-amber-700 text-sm mt-2 max-w-sm mx-auto">
                Tu pago está siendo verificado por la entidad bancaria. Pronto te enviaremos una confirmación al correo.
              </p>
            </div>
          </div>

          <!-- Rechazado / Error -->
          <div v-else class="text-center space-y-4">
            <div class="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-200 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h3 class="text-2xl font-black text-slate-900 tracking-tight">Transacción Rechazada</h3>
              <p class="text-rose-600 text-sm mt-2 max-w-sm mx-auto">
                {{ store.transactionResult?.errorMessage || 'El banco ha rechazado la operación. Por favor verifica tus fondos o intenta con otra tarjeta.' }}
              </p>
            </div>
          </div>

          <!-- Receipt Details -->
          <div class="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2.5 text-xs text-slate-600">
            <div class="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span>Referencia del pedido:</span>
              <span class="font-mono font-bold text-slate-900 text-right">{{ store.transactionResult?.reference || 'N/A' }}</span>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span>ID de Transacción Wompi:</span>
              <span class="font-mono text-slate-900 text-right">{{ store.transactionResult?.id || 'N/A' }}</span>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span>Monto total:</span>
              <span class="font-extrabold text-slate-900 text-right">{{ formatCurrency(store.transactionResult?.amountInCents ?? store.totalAmountInCents) }}</span>
            </div>
            <div class="flex justify-between items-center py-1">
              <span>Estado del pago:</span>
              <span 
                :class="[
                  'px-2 py-0.5 rounded font-bold uppercase text-[9px] tracking-wider border',
                  store.transactionResult?.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  store.transactionResult?.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-rose-50 text-rose-700 border-rose-200'
                ]"
              >
                {{ store.transactionResult?.status }}
              </span>
            </div>
          </div>
        </div>

      </div>

      <!-- Action Buttons Footer -->
      <div v-if="activeStep <= 2 || activeStep === 4" class="px-6 sm:px-8 py-5 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
        
        <!-- Step 1 Actions -->
        <template v-if="activeStep === 1">
          <button 
            @click="handleCloseModal"
            class="px-5 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition duration-200"
          >
            Cancelar
          </button>
          <button 
            @click="goToStep2"
            class="px-6 py-2.5 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition duration-200 flex items-center gap-1.5 shadow-sm"
          >
            Siguiente: Envío
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </template>

        <!-- Step 2 Actions -->
        <template v-else-if="activeStep === 2">
          <button 
            @click="goBackToStep1"
            class="px-5 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition duration-200"
          >
            Atrás
          </button>
          <button 
            @click="handleConfirmPayment"
            class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition duration-200 shadow-sm flex items-center gap-1.5"
          >
            Pagar {{ formatCurrency(store.totalAmountInCents) }}
          </button>
        </template>

        <!-- Step 4 Actions -->
        <template v-else-if="activeStep === 4">
          <button 
            @click="handleCloseModal"
            class="w-full py-3 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition duration-200 text-center shadow-sm"
          >
            Terminar y Volver al Catálogo
          </button>
        </template>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scrollbar custom style */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
