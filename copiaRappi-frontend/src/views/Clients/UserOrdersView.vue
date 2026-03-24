<template>
<div class="orders-container">
  <div class="orders-header">
    <h1>Mis Órdenes</h1>
    <p>Historial y estado de tus pedidos</p>
  </div>

  <div v-if="isLoading" class="loading-state">
    <div class="spinner"></div>
    <p>Cargando tus órdenes...</p>
  </div>

  <div v-else-if="ordersError" class="error-message">
    <p>❌ {{ ordersError }}</p>
    <button @click="retryLoadOrders" class="btn-retry">Reintentar</button>
  </div>

  <div v-else-if="orders.length === 0" class="empty-state">
    <p class="empty-icon">🛒</p>
    <p class="empty-message">No hay órdenes registradas</p>
    <router-link to="/" class="btn-continue-shopping">
      Continuar Comprando
    </router-link>
  </div>

  <div v-else class="orders-grid">
    <div v-for="order in orders" :key="order.id" class="order-card">
      <!-- Encabezado de la orden -->
      <div class="order-header">
        <div class="order-info">
          <h3 class="order-id">Orden #{{ order.id }}</h3>
          <p class="order-date">{{ formatDate(order.createdAt) }}</p>
        </div>
        <div class="order-status" :class="getStatusClass(order.status)">
          {{ getStatusLabel(order.status) }}
        </div>
      </div>

      <!-- Detalles de la orden -->
      <div class="order-details">
        <div class="detail">
          <span class="label">Total:</span>
          <span class="value amount">${{ order.totalAmount || '0.00' }}</span>
        </div>

        <div class="detail">
          <span class="label">Dirección:</span>
          <span class="value address">{{ order.address }}</span>
        </div>

        <div v-if="order.items && order.items.length > 0" class="detail">
          <span class="label">Artículos:</span>
          <span class="value">{{ order.items.length }} producto(s)</span>
        </div>

        <div class="detail">
          <span class="label">Estado del Pago:</span>
          <span class="payment-status" :class="getPaymentStatusClass(order)">
            {{ getPaymentStatusLabel(order) }}
          </span>
        </div>
      </div>

      <!-- Acciones -->
      <div class="order-actions">
        <button 
          @click="goToOrderDetails(order.id)"
          class="btn-action btn-view"
        >
          Ver Detalles
        </button>

        <button 
          v-if="needsPayment(order) && order.status === 'PENDING'"
          @click="goToPayment(order.id)"
          class="btn-action btn-pay"
        >
          Pagar Ahora
        </button>
        <div
          v-else-if="order.status === 'COMPLETED' || order.status === 'DELIVERED' || order.status === 'IN_PROGRESS'"
        >
          <span class="blocked">Ya pagado</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Botón volver -->
  <div class="footer-actions">
    <button @click="returnToProfile" class="btn-back">
      ← Volver al Perfil
    </button>
  </div>
</div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useUserStore } from '../../store/userStore.js';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const userStore = useUserStore();

const user = computed(() => userStore.user);

const orders = ref([]);
const ordersError = ref('');
const isLoading = ref(false);

const authHeaders = () => ({ headers: { Authorization: `Bearer ${userStore.token}` } });

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusLabel = (status) => {
  const labels = {
    PENDING: '⏳ Pendiente',
    IN_PROGRESS: '🔄 En Proceso',
    COMPLETED: '✅ Completada',
    CANCELLED: '❌ Cancelada',
    DELIVERED: '🚪 Entregada',
  };
  return labels[status] || status;
};

const getStatusClass = (status) => {
  return status.toLowerCase();
};

const getPaymentStatusLabel = (order) => {

  if (order.payment && order.payment.status === 'COMPLETED') {
    return '✓ Pagado';
  }

  if (order.payment && order.payment.status === 'PENDING') {
    return '⏳ Pago Pendiente';
  }

  if(order.payment && order.payment.status === 'FAILED') {
    return '❌ Pago Fallido';
  }

  if(order.payment && order.payment.status === 'REFUNDED') {
    return '💸 Reembolsado';
  }

  return '❌ Sin Pago';
};

const getPaymentStatusClass = (order) => {
  if (order.payment && order.payment.status === 'COMPLETED') {
    return 'paid';
  }
  if (order.payment && order.payment.status === 'PENDING') {
    return 'pending';
  }
  return 'unpaid';
};

const needsPayment = (order) => {
  return (!order.payment || order.payment.status !== 'COMPLETED') && order.status !== 'CANCELLED';
};

const goToPayment = (orderId) => {
  const order = orders.value.find(o => o.id === orderId);
  if (!order) return;
  sessionStorage.setItem('pendingOrder', JSON.stringify(order));
  router.push(`/order-confirmation/${orderId}`);
};

const goToOrderDetails = (orderId) => {
  const order = orders.value.find(o => o.id === orderId);
  if (!order) return;
  sessionStorage.setItem('pendingOrder', JSON.stringify(order));
  router.push(`/order-confirmation/${orderId}`);
};

const retryLoadOrders = async () => {
  await loadOrders();
};

const loadOrders = async () => {
  if (!user.value) return;

  isLoading.value = true;
  ordersError.value = '';

  try {
    if (user.value.role !== 'ADMIN') {
      const res = await axios.get(
        `http://localhost:3000/user/${user.value.id}/orders`,
        authHeaders()
      );
      orders.value = res.data;
      orders.value.sort((a, b) => a.id - b.id);
    }
  } catch (err) {
    console.error('Error al cargar órdenes:', err);
    ordersError.value = err.response?.data?.message || 'No se pudieron cargar las órdenes';
  } finally {
    isLoading.value = false;
  }
};

const returnToProfile = async () => {
  router.replace('/profile');
};

onMounted(() => {
  loadOrders();
});
</script>

<style scoped>
.orders-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
}

.orders-header {
  text-align: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
}

.orders-header h1 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 32px;
}

.orders-header p {
  margin: 0;
  color: #999;
  font-size: 16px;
}

/* Estados de carga y error */
.loading-state,
.empty-state,
.error-message {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #42b883;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-state p,
.empty-state p:not(.empty-icon) {
  color: #999;
  margin: 0;
}

.empty-icon {
  font-size: 48px;
  margin: 0 0 16px 0;
}

.empty-message {
  color: #999;
  font-size: 16px;
  margin: 0 0 20px 0;
}

.error-message {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.error-message p {
  margin: 0 0 12px 0;
}

/* Grid de órdenes */
.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.order-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.order-info h3 {
  margin: 0 0 4px 0;
  color: #333;
  font-size: 16px;
  font-weight: bold;
}

.order-date {
  margin: 0;
  color: #999;
  font-size: 12px;
}

.order-status {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
}

.order-status.pending {
  background-color: #fff3cd;
  color: #856404;
}

.order-status.processing {
  background-color: #d1ecf1;
  color: #0c5460;
}

.order-status.completed,
.order-status.delivered {
  background-color: #d4edda;
  color: #155724;
}

.order-status.cancelled {
  background-color: #f8d7da;
  color: #721c24;
}

.order-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  padding: 8px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.label {
  color: #666;
  font-weight: 500;
}

.value {
  color: #333;
  font-weight: bold;
  text-align: right;
}

.value.amount {
  color: #42b883;
  font-size: 14px;
}

.value.address {
  font-size: 12px;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.payment-status {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
}

.payment-status.paid {
  background-color: #d4edda;
  color: #155724;
}

.payment-status.pending {
  background-color: #fff3cd;
  color: #856404;
}

.payment-status.unpaid {
  background-color: #f8d7da;
  color: #721c24;
}

/* Acciones */
.order-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 8px;
}

.btn-action {
  padding: 10px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-view {
  background-color: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.btn-view:hover {
  background-color: #f0f0f0;
  border-color: #42b883;
}

.btn-pay {
  background-color: #42b883;
  color: white;
  grid-column: 2;
}

.btn-pay:hover {
  background-color: #369870;
  box-shadow: 0 2px 8px rgba(66, 184, 131, 0.3);
}

.btn-continue-shopping {
  display: inline-block;
  padding: 12px 24px;
  background-color: #42b883;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: bold;
  transition: background-color 0.2s;
}

.btn-continue-shopping:hover {
  background-color: #369870;
}

.blocked {
  opacity: 0.6;
  pointer-events: none;
  user-select: none;
  display: block;
  text-align: center;
  font-weight: bold;
  padding: 10px 12px;

}

/* Footer */
.footer-actions {
  text-align: center;
  padding-top: 20px;
  border-top: 2px solid #f0f0f0;
}

.btn-back {
  padding: 12px 24px;
  background-color: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.btn-back:hover {
  background-color: #f0f0f0;
  border-color: #42b883;
  color: #42b883;
}

.btn-retry {
  padding: 10px 20px;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  margin-top: 12px;
  transition: background-color 0.2s;
}

.btn-retry:hover {
  background-color: #369870;
}


@media (max-width: 768px) {
  .orders-grid {
    grid-template-columns: 1fr;
  }

  .order-actions {
    grid-template-columns: 1fr;
  }

  .btn-pay,
  .btn-secondary {
    grid-column: 1;
  }

  .orders-header h1 {
    font-size: 24px;
  }
}
</style>

