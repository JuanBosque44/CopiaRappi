<script setup>
import { ref, onMounted, computed } from 'vue';
import { useUserStore } from '../store/index.js';
import { usePaymentStore } from '../store/paymentStore.js';
import { useRouter } from 'vue-router';

const router = useRouter();
const userStore = useUserStore();
const paymentStore = usePaymentStore();

const isLoading = ref(false);
const activeTab = ref('all');
const filterStatus = ref('all');

const tabOptions = [
  { id: 'all', name: 'Todos' },
  { id: 'completed', name: 'Completados' },
  { id: 'pending', name: 'Pendientes' },
];

const paymentStatusColors = {
  COMPLETED: { bg: '#d4edda', text: '#155724' },
  PENDING: { bg: '#fff3cd', text: '#856404' },
  FAILED: { bg: '#f8d7da', text: '#721c24' },
};

const filteredPayments = computed(() => {
  let payments = paymentStore.payments.filter(p => p.userId === userStore.user.id);

  if (activeTab.value === 'completed') {
    payments = payments.filter(p => p.status === 'COMPLETED');
  } else if (activeTab.value === 'pending') {
    payments = payments.filter(p => p.status === 'PENDING');
  }

  return payments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
});

const totalPaid = computed(() => {
  return paymentStore.payments
    .filter(p => p.userId === userStore.user.id && p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0)
    .toFixed(2);
});

const pendingAmount = computed(() => {
  return paymentStore.payments
    .filter(p => p.userId === userStore.user.id && p.status === 'PENDING')
    .reduce((sum, p) => sum + p.amount, 0)
    .toFixed(2);
});

const fetchPayments = async () => {
  isLoading.value = true;
  try {
    await paymentStore.fetchPayments(userStore.token);
  } catch (error) {
    console.error('Error fetching payments:', error);
  } finally {
    isLoading.value = false;
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusBadge = (status) => {
  const statusMap = {
    COMPLETED: '✓ Pagado',
    PENDING: '⏳ Pendiente',
    FAILED: '✗ Fallido',
  };
  return statusMap[status] || status;
};

const handleRetryPayment = async (payment) => {
  if (payment.status === 'PENDING') {
    router.push(`/order-confirmation/${payment.orderId}`);
  }
};

onMounted(() => {
  if (userStore.isAuthenticated) {
    fetchPayments();
  }
});
</script>

<template>
  <div class="payments-container">
    <div class="payments-header">
      <h1>💳 Mis Pagos</h1>
      <p>Historial y estado de tus transacciones</p>
    </div>

    <!-- Estadísticas -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <span class="stat-label">Total Pagado</span>
          <span class="stat-value">${{ totalPaid }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">⏳</div>
        <div class="stat-content">
          <span class="stat-label">Pagos Pendientes</span>
          <span class="stat-value">${{ pendingAmount }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">✓</div>
        <div class="stat-content">
          <span class="stat-label">Total de Transacciones</span>
          <span class="stat-value">{{ paymentStore.payments.filter(p => p.userId === userStore.user.id).length }}</span>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filters-section">
      <div class="tab-buttons">
        <button
          v-for="tab in tabOptions"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="tab-button"
          :class="{ active: activeTab === tab.id }"
        >
          {{ tab.name }}
        </button>
      </div>

      <button @click="fetchPayments" class="btn-refresh" :disabled="isLoading">
        🔄 {{ isLoading ? 'Actualizando...' : 'Actualizar' }}
      </button>
    </div>

    <!-- Lista de pagos -->
    <div v-if="!isLoading" class="payments-list">
      <div v-if="filteredPayments.length === 0" class="empty-state">
        <p class="empty-icon">📭</p>
        <p class="empty-message">No hay pagos para mostrar</p>
        <router-link to="/user" class="btn-back">Volver a Mis Pedidos</router-link>
      </div>

      <div v-else class="payments-grid">
        <div
          v-for="payment in filteredPayments"
          :key="payment.id"
          class="payment-card"
        >
          <div class="payment-header">
            <div class="payment-info">
              <h3 class="payment-id">Pago #{{ payment.id }}</h3>
              <p class="payment-date">{{ formatDate(payment.createdAt) }}</p>
            </div>
            <div
              class="status-badge"
              :style="paymentStatusColors[payment.status]"
            >
              {{ getStatusBadge(payment.status) }}
            </div>
          </div>

          <div class="payment-details">
            <div class="detail">
              <span class="label">Orden:</span>
              <span class="value">#{{ payment.orderId || 'N/A' }}</span>
            </div>

            <div class="detail">
              <span class="label">Método:</span>
              <span class="value">{{ getPaymentMethodLabel(payment.paymentMethod) }}</span>
            </div>

            <div class="detail">
              <span class="label">Monto:</span>
              <span class="value amount">${{ payment.amount.toFixed(2) }}</span>
            </div>
          </div>

          <div class="payment-actions">
            <button
              v-if="payment.status === 'PENDING'"
              @click="handleRetryPayment(payment)"
              class="btn-action btn-retry"
            >
              Completar Pago
            </button>
            <button
              v-else
              class="btn-action btn-view"
              @click="() => {}"
            >
              Ver Detalles
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Cargando -->
    <div v-else class="loading-state">
      <div class="spinner"></div>
      <p>Cargando tus pagos...</p>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    getPaymentMethodLabel(method) {
      const methods = {
        'credit-card': '💳 Tarjeta de Crédito',
        'debit-card': '🏦 Tarjeta de Débito',
        'digital-wallet': '📱 Billetera Digital',
        'cash': '💵 Efectivo',
      };
      return methods[method] || method;
    },
  },
};
</script>

<style scoped>
.payments-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.payments-header {
  text-align: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
}

.payments-header h1 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 32px;
}

.payments-header p {
  margin: 0;
  color: #999;
  font-size: 16px;
}

/* Estadísticas */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #42b883;
}

.stat-icon {
  font-size: 32px;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 12px;
  color: #999;
  font-weight: 500;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

/* Filtros */
.filters-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 16px;
}

.tab-buttons {
  display: flex;
  gap: 8px;
}

.tab-button {
  padding: 10px 20px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.tab-button:hover {
  border-color: #42b883;
}

.tab-button.active {
  background: #42b883;
  color: white;
  border-color: #42b883;
}

.btn-refresh {
  padding: 10px 20px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-refresh:hover:not(:disabled) {
  background-color: #f0f0f0;
  border-color: #42b883;
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Lista de pagos */
.payments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.payment-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.payment-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.payment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.payment-info h3 {
  margin: 0 0 4px 0;
  color: #333;
  font-size: 16px;
}

.payment-date {
  margin: 0;
  color: #999;
  font-size: 12px;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
}

.payment-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.label {
  color: #666;
  font-weight: 500;
}

.value {
  color: #333;
  font-weight: bold;
}

.value.amount {
  color: #42b883;
  font-size: 16px;
}

.payment-actions {
  display: flex;
  gap: 10px;
}

.btn-action {
  flex: 1;
  padding: 10px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-retry {
  background-color: #ffc107;
  color: #333;
}

.btn-retry:hover {
  background-color: #ffb300;
}

.btn-view {
  background-color: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.btn-view:hover {
  background-color: #f0f0f0;
}

/* Estados vacío y cargando */
.empty-state,
.loading-state {
  text-align: center;
  padding: 60px 20px;
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

.btn-back {
  display: inline-block;
  padding: 12px 24px;
  background-color: #42b883;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: bold;
  transition: background-color 0.2s;
}

.btn-back:hover {
  background-color: #369870;
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

.loading-state p {
  color: #999;
  margin: 0;
}

@media (max-width: 768px) {
  .payments-grid {
    grid-template-columns: 1fr;
  }

  .filters-section {
    flex-direction: column;
    align-items: stretch;
  }

  .tab-buttons {
    width: 100%;
    justify-content: flex-start;
    overflow-x: auto;
  }

  .btn-refresh {
    width: 100%;
  }
}
</style>
