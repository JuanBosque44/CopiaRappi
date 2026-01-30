<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '../store/userStore.js';
import { usePaymentStore } from '../store/paymentStore.js';

const props = defineProps({
  orderData: {
    type: Object,
    required: true,
  },
  totalAmount: {
    type: [Number, String],
    required: true,
  },
});

const emit = defineEmits(['payment-success', 'payment-error', 'close']);

const userStore = useUserStore();
const paymentStore = usePaymentStore();

const paymentMethodConfig = {
  1: 'card',
  3: 'card',
  4: 'wallet',
  2: 'cash',
};

const currentMethodType = computed(
  () => paymentMethodConfig[selectedMethod.value]
);


const isProcessing = ref(false);
const selectedMethod = ref('card');
const paymentMethods = ref([])

onMounted(async() =>{
    const methods = await paymentStore.fetchPaymentsMethods();
    console.log('Fetched payment methods:', methods);
    if(methods?.length){
        selectedMethod.value = methods[0].name;
    }
    paymentMethods.value = methods?.length ? methods : [
        { id: 'credit-card', name: '💳 Tarjeta de Crédito', icon: '💳' },
        { id: 'debit-card', name: '🏦 Tarjeta de Débito', icon: '🏦' },
        { id: 'digital-wallet', name: '📱 Billetera Digital', icon: '📱' },
        { id: 'cash', name: '💵 Efectivo', icon: '💵' },
    ];;
})

// Datos del formulario
const cardData = ref({
  cardholderName: userStore.user.name,
  cardNumber: '',
  expirationDate: '',
  cvv: '',
});

const digitalWalletData = ref({
  email: userStore.user.email,
  phoneNumber: '',
});

// Validaciones
const isCardFormValid = computed(() => {
  if (currentMethodType.value !== 'card') {
    return true;
  }
  return (
    cardData.value.cardholderName &&
    cardData.value.cardNumber.replace(/\s/g, '').length === 16 &&
    cardData.value.expirationDate.match(/^\d{2}\/\d{2}$/) &&
    cardData.value.cvv.length === 3
  );
});

const isDigitalWalletValid = computed(() => {
  if (currentMethodType.value !== 'wallet') {
    return true;
  }
  return cardData.value.email && digitalWalletData.value.phoneNumber.match(/^\d{10}$/);
});

const isFormValid = computed(() => isCardFormValid.value && isDigitalWalletValid.value);

// Formatear número de tarjeta
const formatCardNumber = (value) => {
  return value
    .replace(/\s/g, '')
    .replace(/(\d{4})/g, '$1 ')
    .trim();
};

const formatExpirationDate = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1/$2')
    .slice(0, 5);
};

const handleCardNumberInput = (e) => {
  cardData.value.cardNumber = formatCardNumber(e.target.value);
};

const handleExpirationDateInput = (e) => {
  cardData.value.expirationDate = formatExpirationDate(e.target.value);
};

const handleCVVInput = (e) => {
  cardData.value.cvv = e.target.value.replace(/\D/g, '').slice(0, 3);
};

// Procesar pago
const handlePayment = async () => {
  if (!isFormValid.value) {
    emit('payment-error', 'Por favor completa todos los campos correctamente');
    return;
  }

  isProcessing.value = true;

  try {
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (!userStore.user || !userStore.token) {
      throw new Error('Usuario no autenticado');
    }

    if(selectedMethod.value === ''){
        throw new Error('Seleccione un método de pago');
    }


    const paymentData = {
      orderId: props.orderData.id,
      userId: userStore.user.id,
      amount: parseFloat(props.totalAmount),
      methodId: selectedMethod.value, 
    };

    console.log('Payment confirmed:', paymentData);
    const response = await paymentStore.createPayment(paymentData, userStore.token);

    // Simular confirmación exitosa
    /* const confirmResponse = await paymentStore.confirmPayment(
      response.id,
      true,
      userStore.token
    ); */
    emit('payment-saved', response);
  } catch (error) {
    console.error('Payment error:', error);
    emit('payment-error', error.message || 'Error al procesar el pago');
  } finally {
    isProcessing.value = false;
  }
};

const handleCancel = () => {
  emit('close');
};
</script>

<template>
  <div class="payment-form-container">
    <div class="form-header">
      <h2>💳 Formulario de Pago</h2>
      <button @click="handleCancel" class="btn-close">✕</button>
    </div>

    <form @submit.prevent="handlePayment" class="payment-form">
      <!-- Monto a pagar -->
      <div class="amount-section">
        <div class="amount-card">
          <span class="amount-label">Total a Pagar:</span>
          <span class="amount-value">${{ totalAmount }}</span>
        </div>
      </div>

      <!-- Selección de método de pago -->
      <div class="form-section">
        <h3>Método de Pago</h3>
        <div class="payment-methods">
          <label 
            v-for="method in paymentMethods" 
            :key="method.id"
            class="method-option"
          >
            <input 
              type="radio" 
              :value="method.id" 
              v-model="selectedMethod"
              class="radio-input"
            />
            <span class="method-name">{{ method.name }}</span>
          </label>
        </div>
      </div>

      <!-- Formulario para tarjeta -->
      <template v-if="currentMethodType === 'card'">
        <div class="form-section">
          <h3>{{ selectedMethod === 'Tarjeta actualizada' ? 'Datos de Tarjeta de Crédito' : 'Datos de Tarjeta de Débito' }}</h3>

          <div class="form-group">
            <label>Nombre del Titular</label>
            <input 
              v-model="cardData.cardholderName"
              type="text"
              placeholder="Nombre completo"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label>Número de Tarjeta</label>
            <input 
              :value="cardData.cardNumber"
              @input="handleCardNumberInput"
              type="text"
              placeholder="1234 5678 9012 3456"
              class="form-input"
              maxlength="19"
              required
            />
            <small class="form-hint">16 dígitos</small>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Fecha de Expiración</label>
              <input 
                :value="cardData.expirationDate"
                @input="handleExpirationDateInput"
                type="text"
                placeholder="MM/YY"
                class="form-input"
                maxlength="5"
                required
              />
              <small class="form-hint">MM/YY</small>
            </div>

            <div class="form-group">
              <label>CVV</label>
              <input 
                :value="cardData.cvv"
                @input="handleCVVInput"
                type="password"
                placeholder="123"
                class="form-input"
                maxlength="3"
                required
              />
              <small class="form-hint">3 dígitos</small>
            </div>
          </div>
        </div>
      </template>

      <!-- Formulario para billetera digital -->
      <template v-else-if="currentMethodType === 'wallet'">
        <div class="form-section">
          <h3>Datos de Billetera Digital</h3>

          <div class="form-group">
            <label>Email</label>
            <input 
              v-model="digitalWalletData.email"
              type="email"
              placeholder="tu@email.com"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label>Número de Teléfono</label>
            <input 
              v-model="digitalWalletData.phoneNumber"
              type="tel"
              placeholder="3001234567"
              class="form-input"
              required
            />
            <small class="form-hint">10 dígitos</small>
          </div>
        </div>
      </template>

      <!-- Formulario para efectivo -->
      <template v-else-if="currentMethodType === 'cash'">
        <div class="form-section cash-info">
          <h3>Pago en Efectivo</h3>
          <div class="info-box">
            <p>
              <strong>💡 Información:</strong> El pago será realizado al momento de la entrega. 
              Asegúrate de tener el dinero exacto o cambio disponible.
            </p>
            <ul>
              <li>Monto a pagar: <strong>${{ totalAmount }}</strong></li>
              <li>Entregador recogerá el pago en tu domicilio</li>
              <li>Solicita comprobante de pago</li>
            </ul>
          </div>
        </div>
      </template>

      <!-- Información de seguridad -->
      <div class="security-info">
        <p>🔒 Tu información de pago está protegida y encriptada</p>
      </div>

      <!-- Botones de acción -->
      <div class="form-actions">
        <button 
          type="button"
          @click="handleCancel"
          class="btn-cancel"
          :disabled="isProcessing"
        >
          Cancelar
        </button>
        <button 
          type="submit"
          class="btn-submit"
          :disabled="!isFormValid || isProcessing"
        >
          {{ isProcessing ? 'Procesando...' : `Pagar $${totalAmount}` }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.payment-form-container {
  background: white;
  border-radius: 8px;
  padding: 24px;
  max-width: 500px;
  margin: 0 auto;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.form-header h2 {
  margin: 0;
  color: #333;
  font-size: 20px;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  transition: color 0.2s;
}

.btn-close:hover {
  color: #333;
}

.payment-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.amount-section {
  margin-bottom: 12px;
}

.amount-card {
  background: linear-gradient(135deg, #42b883 0%, #369870 100%);
  color: white;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.amount-label {
  font-size: 14px;
  opacity: 0.9;
}

.amount-value {
  font-size: 32px;
  font-weight: bold;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-section h3 {
  margin: 0;
  color: #333;
  font-size: 14px;
  font-weight: bold;
}

.payment-methods {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.method-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.method-option:hover {
  border-color: #42b883;
  background-color: #f9f9f9;
}

.radio-input {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #42b883;
}

.method-name {
  font-size: 13px;
  color: #333;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 12px;
  font-weight: bold;
  color: #666;
}

.form-input {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-family: inherit;
  font-size: 14px;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #42b883;
  box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.1);
}

.form-hint {
  font-size: 11px;
  color: #999;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.cash-info {
  background-color: #f9f9f9;
  padding: 16px;
  border-radius: 6px;
}

.info-box {
  background-color: #e3f2fd;
  border-left: 4px solid #2196f3;
  padding: 12px;
  border-radius: 4px;
  margin-top: 12px;
}

.info-box p {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #1565c0;
  font-weight: 500;
}

.info-box ul {
  margin: 8px 0 0 0;
  padding-left: 20px;
  font-size: 12px;
  color: #1565c0;
}

.info-box li {
  margin: 4px 0;
}

.security-info {
  text-align: center;
  padding: 12px;
  background-color: #f0f0f0;
  border-radius: 6px;
  font-size: 12px;
  color: #666;
}

.form-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.btn-cancel,
.btn-submit {
  padding: 12px 16px;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.btn-cancel {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.btn-cancel:hover:not(:disabled) {
  background-color: #f0f0f0;
}

.btn-submit {
  background-color: #42b883;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background-color: #369870;
  box-shadow: 0 4px 12px rgba(66, 184, 131, 0.3);
}

.btn-cancel:disabled,
.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .payment-methods {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    grid-template-columns: 1fr;
  }
}
</style>
