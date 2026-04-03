<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '../../store/userStore.js';
import axios from 'axios';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const isLoading = ref(false);
const orderData = ref(null);
const showPaymentForm = ref(false);
const isExistingOrder = ref(false);

const initializeOrder = async () => {
  const storedOrder = sessionStorage.getItem('pendingOrder');
  if (storedOrder) {
    orderData.value = JSON.parse(storedOrder);
    isExistingOrder.value = false;
    return;
  }

  if (route.params.orderId && !storedOrder) {
    isExistingOrder.value = true;
    isLoading.value = true;
    try {
      const response = await axios.get(
        `http://localhost:3000/orders/${route.params.orderId}/summary`,
        { headers: { Authorization: `Bearer ${userStore.token}` } }
      );
      orderData.value = response.data;
    } catch (error) {
      console.error('Error al obtener la orden:', error);
      alert('Error al obtener los datos de la orden');
      router.push('/user/orders');
    } finally {
      isLoading.value = false;
    }
    return;
  }

  // Si no hay orden, redirigir
  router.push('/user/orders');
};

const isAvailableForPayment = computed(() => {
  if (!orderData.value || !orderData.value.items || orderData.value.items.length === 0) return false;
  return orderData.value.totalAmount > 0 ? true : false;
});

const totalWithFees = computed(() => {
  if (!orderData.value) return 0;
  const subtotal = Number(orderData.value.totalAmount);
  const shipping = 5.00;
  const taxes = subtotal * 0.1;
  const total = subtotal + shipping + taxes;
  return Number(total)
});

const handleProceedToPayment = () => {
  showPaymentForm.value = true;
  
};

const handlePayLater = async () => {
  if (!orderData.value) return;
  
  isLoading.value = true;
  try {
    if (!isExistingOrder.value) {
      sessionStorage.removeItem('pendingOrder');
    }
    router.push({
      name: 'payment-confirmation',
      params: { orderId: orderData.value.id, status: 'pending' }
    });
  } finally {
    isLoading.value = false;
  }
};

const handlePaymentSuccess = async (paymentResponse) => {
  isLoading.value = true;
  try {
    // Limpiar sesión solo si es orden nueva
    if (!isExistingOrder.value) {
      sessionStorage.removeItem('pendingOrder');
    }
    router.push({
      path: '/payment/confirmation',
      name: 'payment-confirmation',
      params: { orderId: orderData.value.id, status: 'success' }
    });
  } finally {
    isLoading.value = false;
  }
};

const handlePaymentError = (error) => {
  alert(`Error en el pago: ${error}`);
};

const handleBackToCart = () => {
  sessionStorage.removeItem('pendingOrder');
  if (isExistingOrder.value) {
    router.push('/user/orders');
  } else {
    router.push('/cart');
  }
};

const formatDate = (dateString) => {
  if(!dateString) return new Date().toLocaleDateString('es-ES');
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

initializeOrder();
</script>

<template>
  <div class="confirmation-container">
    <div class="confirmation-header">
      <h1>📋 Confirmación de Pedido</h1>
      <p v-if="!showPaymentForm">Revisa tu pedido antes de pagar</p>
    </div>

    <div v-if="orderData && !showPaymentForm" class="confirmation-content">
      <!-- Resumen de la orden -->
      <div class="order-summary">
        <div class="order-card">
          <h2>Resumen del Pedido</h2>

          <div class="order-details">
            <div class="detail-row">
              <span class="label">Número de Pedido:</span>
              <span class="value">#{{ orderData.id || route.params.orderId }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Estado:</span>
              <span class="status-badge" :class="isExistingOrder ? orderData.status.toLowerCase() : 'Pendiente'">
                {{ isExistingOrder ? orderData.status : 'Pendiente de Pago' }}
              </span>
            </div>
            <div v-if="isExistingOrder" class="detail-row">
              <span class="label">Fecha:</span>
              <span class="value">{{ formatDate(orderData.createdAt) }}</span>
            </div>
          </div>

          <div class="items-summary">
            <h3>Artículos</h3>
            <div class="items-list">
              <div v-for="item in orderData.items" :key="item.productId" class="item-summary">
                <span class="item-name">{{ item.productId }}</span>
                <span class="item-qty">x{{ item.quantity }}</span>
              </div>
            </div>
          </div>

          <div class="pricing-summary">
            <div class="price-row">
              <span>Subtotal:</span>
              <span>${{ orderData.totalAmount }}</span>
            </div>
            <div class="price-row">
              <span>Envío:</span>
              <span>$5.00</span>
            </div>
            <div class="price-row">
              <span>Impuestos (10%):</span>
              <span>${{ (orderData.totalAmount * 0.1).toFixed(2) }}</span>
            </div>
            <div class="price-row total">
              <span>Total a Pagar:</span>
              <span>${{ (totalWithFees * 1).toFixed(2) }}</span>
            </div>
          </div>

          <div class="delivery-summary">
            <h3>Información de Entrega</h3>
            <div class="delivery-info">
              <p><strong>Dirección:</strong> {{ orderData.address }}</p>
              <p v-if="orderData.deliveryPhone"><strong>Teléfono:</strong> {{ orderData.deliveryPhone }}</p>
              <p><strong>Usuario:</strong> {{ userStore.user.name }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Opciones de pago -->
      <div class="payment-options">
        <div class="options-card">
          <h2>¿Cómo deseas proceder?</h2>

          <div class="button-group">
            <button 
              @click="handleProceedToPayment" 
              class="btn-primary"
              :disabled="isLoading || !isAvailableForPayment"
            >
              💳 Pagar Ahora
            </button>

            <button 
              v-if="!isExistingOrder"
              @click="handlePayLater" 
              class="btn-secondary"
              :disabled="isLoading || !isAvailableForPayment"
            >
              ⏰ Pagar Después
            </button>

            <button 
              @click="handleBackToCart" 
              class="btn-tertiary"
              :disabled="isLoading"
            >
              ← {{ isExistingOrder ? 'Volver a Mis Órdenes' : 'Volver al Carrito' }}
            </button>
          </div>

          <div class="info-box">
            <p v-if="!isExistingOrder && isAvailableForPayment">
              <strong>💡 Nota:</strong> Puedes pagar ahora o completar tu pedido y pagar después. 
              Si pagas después, tendrás 24 horas para completar el pago.
            </p>
            <p v-else>
              <strong>💡 Nota:</strong> Puedes completar el pago de esta orden en cualquier momento.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Formulario de pago -->
    <PaymentForm 
      v-else-if="showPaymentForm && orderData"
      :order-data="orderData"
      :total-amount="totalWithFees"
      @payment-success="handlePaymentSuccess"
      @payment-error="handlePaymentError"
      @close="showPaymentForm = false"
    />

    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script>
import PaymentForm from '../../components/PaymentForm.vue';

export default {
  components: {
    PaymentForm,
  },
};
</script>

<style scoped>
.confirmation-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
}

.confirmation-header {
  text-align: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
}

.confirmation-header h1 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 32px;
}

.confirmation-header p {
  margin: 0;
  color: #999;
  font-size: 16px;
}

.confirmation-content {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 30px;
}

.order-summary {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.order-card,
.options-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.order-card h2,
.options-card h2 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 12px;
}

.order-details {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
}

.detail-row .label {
  color: #666;
  font-weight: 500;
}

.detail-row .value {
  color: #333;
  font-weight: bold;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  display: inline-block;
}

.status-badge.pending {
  background-color: #fff3cd;
  color: #856404;
}

.status-badge.completed {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.cancelled {
  background-color: #f8d7da;
  color: #721c24;
}

.status-badge.processing {
  background-color: #d1ecf1;
  color: #0c5460;
}

.items-summary h3 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 14px;
  font-weight: bold;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  padding: 12px;
  background-color: #f9f9f9;
  border-radius: 6px;
}

.item-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  font-size: 13px;
  border-bottom: 1px solid #f0f0f0;
}

.item-summary:last-child {
  border-bottom: none;
}

.item-name {
  color: #666;
}

.item-qty {
  color: #42b883;
  font-weight: bold;
}

.pricing-summary {
  margin-bottom: 20px;
  padding: 12px;
  background-color: #f9f9f9;
  border-radius: 6px;
}

.price-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}

.price-row.total {
  font-weight: bold;
  font-size: 16px;
  color: #333;
  border-top: 1px solid #f0f0f0;
  padding-top: 8px;
  margin-top: 8px;
}

.delivery-summary {
  border-top: 1px solid #f0f0f0;
  padding-top: 20px;
}

.delivery-summary h3 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 14px;
  font-weight: bold;
}

.delivery-info p {
  margin: 6px 0;
  font-size: 13px;
  color: #666;
}

.payment-options {
  position: sticky;
  top: 20px;
  height: fit-content;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.btn-primary,
.btn-secondary,
.btn-tertiary {
  padding: 14px 16px;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.btn-primary {
  background-color: #42b883;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #369870;
  box-shadow: 0 4px 12px rgba(66, 184, 131, 0.3);
}

.btn-secondary {
  background-color: #e8f5e9;
  color: #42b883;
  border: 2px solid #42b883;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #c8e6c9;
}

.btn-tertiary {
  background-color: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.btn-tertiary:hover:not(:disabled) {
  background-color: #f0f0f0;
}

.btn-primary:disabled,
.btn-secondary:disabled,
.btn-tertiary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.info-box {
  background-color: #e3f2fd;
  border-left: 4px solid #2196f3;
  padding: 12px;
  border-radius: 4px;
  margin-top: 16px;
}

.info-box p {
  margin: 0;
  font-size: 13px;
  color: #1565c0;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #42b883;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .confirmation-content {
    grid-template-columns: 1fr;
  }

  .payment-options {
    position: static;
  }

  .confirmation-header h1 {
    font-size: 24px;
  }
}
</style>
