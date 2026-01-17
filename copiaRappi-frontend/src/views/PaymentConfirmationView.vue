<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '../store/index.js';
import { usePaymentStore } from '../store/paymentStore.js';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const paymentStore = usePaymentStore();

const isLoading = ref(false);
const paymentStatus = ref(null);
const orderId = ref(null);

onMounted(() => {
  orderId.value = route.params.orderId;
  paymentStatus.value = route.params.status;
});

const getStatusIcon = () => {
  switch (paymentStatus.value) {
    case 'success':
      return '✅';
    case 'pending':
      return '⏳';
    case 'failed':
      return '❌';
    default:
      return '❓';
  }
};

const getStatusMessage = () => {
  switch (paymentStatus.value) {
    case 'success':
      return 'Pago realizado exitosamente';
    case 'pending':
      return 'Tu pedido está pendiente de pago';
    case 'failed':
      return 'El pago no se pudo procesar';
    default:
      return 'Estado desconocido';
  }
};

const getStatusColor = () => {
  switch (paymentStatus.value) {
    case 'success':
      return 'success';
    case 'pending':
      return 'pending';
    case 'failed':
      return 'failed';
    default:
      return 'default';
  }
};

const handleContinueShoppingOrders = () => {
  router.push('/user/orders');
};

const handleRetryPayment = () => {
  router.push(`/order-confirmation/${orderId.value}`);
};
</script>

<template>
  <div class="confirmation-page">
    <div class="confirmation-wrapper">
      <div class="status-card" :class="getStatusColor()">
        <div class="status-icon">{{ getStatusIcon() }}</div>
        <h1>{{ getStatusMessage() }}</h1>

        <div class="order-details">
          <p v-if="orderId">
            <strong>ID de Pedido:</strong> <span class="order-id">#{{ orderId }}</span>
          </p>
          <p v-if="paymentStatus === 'success'">
            <strong>Estado:</strong> <span class="status-badge success">Pagado</span>
          </p>
          <p v-else-if="paymentStatus === 'pending'">
            <strong>Estado:</strong> <span class="status-badge pending">Pendiente de Pago</span>
          </p>
          <p v-else-if="paymentStatus === 'failed'">
            <strong>Estado:</strong> <span class="status-badge failed">Fallo en el Pago</span>
          </p>
        </div>

        <template v-if="paymentStatus === 'success'">
          <div class="success-details">
            <div class="check-circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2>¡Gracias por tu compra!</h2>
            <p>
              Tu pago ha sido procesado correctamente. Recibirás una confirmación por correo 
              y tu pedido será preparado próximamente.
            </p>
            <div class="next-steps">
              <h3>Próximos pasos:</h3>
              <ul>
                <li>✓ Pago confirmado</li>
                <li>⏳ Restaurante preparando tu pedido</li>
                <li>🚗 Repartidor en camino</li>
                <li>🚪 Entrega en tu domicilio</li>
              </ul>
            </div>
          </div>
        </template>

        <template v-else-if="paymentStatus === 'pending'">
          <div class="pending-details">
            <h2>Tu pedido está listo para pagar</h2>
            <p>
              Tienes 24 horas para completar el pago. Después de ese tiempo, 
              tu pedido será cancelado automáticamente.
            </p>
            <div class="warning-box">
              <strong>⚠️ Recordatorio:</strong> Completa el pago lo antes posible para 
              que tu pedido sea preparado.
            </div>
          </div>
        </template>

        <template v-else-if="paymentStatus === 'failed'">
          <div class="failed-details">
            <h2>Hubo un problema con tu pago</h2>
            <p>
              No pudimos procesar tu pago. Por favor, intenta nuevamente 
              o usa otro método de pago.
            </p>
            <div class="error-box">
              <strong>🔴 Error:</strong> Verifica los datos de tu tarjeta e intenta de nuevo.
            </div>
          </div>
        </template>

        <div class="action-buttons">
          <button 
            v-if="paymentStatus === 'success' || paymentStatus === 'pending'"
            @click="handleContinueShoppingOrders"
            class="btn-primary"
          >
            Ver mis Pedidos
          </button>
          <button 
            v-if="paymentStatus === 'pending' || paymentStatus === 'failed'"
            @click="handleRetryPayment"
            class="btn-secondary"
          >
            Intentar de Nuevo
          </button>
          <router-link to="/" class="btn-tertiary">
            Volver al Inicio
          </router-link>
        </div>
      </div>

      <div class="support-section">
        <h3>¿Necesitas ayuda?</h3>
        <p>
          Si tienes problemas con tu pago o pedido, puedes contactar a nuestro 
          equipo de soporte.
        </p>
        <router-link to="/support" class="support-link">
          📞 Contactar Soporte
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.confirmation-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  padding: 40px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirmation-wrapper {
  max-width: 600px;
  width: 100%;
}

.status-card {
  background: white;
  border-radius: 12px;
  padding: 40px 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.status-icon {
  font-size: 80px;
  margin-bottom: 20px;
  animation: bounce 0.8s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.status-card h1 {
  margin: 0 0 24px 0;
  color: #333;
  font-size: 28px;
}

.order-details {
  background-color: #f9f9f9;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.order-details p {
  margin: 8px 0;
  font-size: 14px;
  color: #666;
}

.order-id {
  font-weight: bold;
  color: #42b883;
  font-size: 16px;
}

.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}

.status-badge.success {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.pending {
  background-color: #fff3cd;
  color: #856404;
}

.status-badge.failed {
  background-color: #f8d7da;
  color: #721c24;
}

/* SUCCESS STATE */
.status-card.success .success-details {
  margin: 24px 0;
}

.check-circle {
  width: 80px;
  height: 80px;
  background-color: #d4edda;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: #155724;
}

.check-circle svg {
  width: 48px;
  height: 48px;
}

.success-details h2 {
  margin: 0 0 12px 0;
  color: #155724;
  font-size: 22px;
}

.success-details p {
  margin: 0 0 20px 0;
  color: #666;
  font-size: 14px;
}

.next-steps {
  background-color: #f0f7f4;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
  text-align: left;
}

.next-steps h3 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 14px;
  font-weight: bold;
}

.next-steps ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.next-steps li {
  padding: 8px 0;
  color: #666;
  font-size: 13px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.next-steps li:last-child {
  border-bottom: none;
}

/* PENDING STATE */
.status-card.pending .pending-details {
  margin: 24px 0;
}

.pending-details h2 {
  margin: 0 0 12px 0;
  color: #856404;
  font-size: 22px;
}

.pending-details p {
  margin: 0 0 16px 0;
  color: #666;
  font-size: 14px;
}

.warning-box {
  background-color: #fff3cd;
  border-left: 4px solid #ffc107;
  padding: 12px;
  border-radius: 4px;
  font-size: 13px;
  color: #856404;
}

/* FAILED STATE */
.status-card.failed .failed-details {
  margin: 24px 0;
}

.failed-details h2 {
  margin: 0 0 12px 0;
  color: #721c24;
  font-size: 22px;
}

.failed-details p {
  margin: 0 0 16px 0;
  color: #666;
  font-size: 14px;
}

.error-box {
  background-color: #f8d7da;
  border-left: 4px solid #dc3545;
  padding: 12px;
  border-radius: 4px;
  font-size: 13px;
  color: #721c24;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 28px;
}

.btn-primary,
.btn-secondary,
.btn-tertiary {
  padding: 14px 24px;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background-color: #42b883;
  color: white;
}

.btn-primary:hover {
  background-color: #369870;
  box-shadow: 0 4px 12px rgba(66, 184, 131, 0.3);
}

.btn-secondary {
  background-color: #ffc107;
  color: #333;
  border: none;
}

.btn-secondary:hover {
  background-color: #ffb300;
}

.btn-tertiary {
  background-color: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.btn-tertiary:hover {
  background-color: #f0f0f0;
}

.support-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-top: 24px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.support-section h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 14px;
}

.support-section p {
  margin: 0 0 12px 0;
  color: #666;
  font-size: 13px;
}

.support-link {
  display: inline-block;
  color: #42b883;
  text-decoration: none;
  font-weight: bold;
  transition: color 0.2s;
}

.support-link:hover {
  color: #369870;
  text-decoration: underline;
}

@media (max-width: 768px) {
  .confirmation-page {
    padding: 20px;
  }

  .status-card {
    padding: 24px 16px;
  }

  .status-icon {
    font-size: 60px;
    margin-bottom: 16px;
  }

  .status-card h1 {
    font-size: 20px;
    margin-bottom: 16px;
  }

  .action-buttons {
    margin-top: 20px;
  }
}
</style>
