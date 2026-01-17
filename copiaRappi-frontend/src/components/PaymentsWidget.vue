<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../store/index.js';
import { usePaymentStore } from '../store/paymentStore.js';

const router = useRouter();
const userStore = useUserStore();
const paymentStore = usePaymentStore();

const pendingPayments = computed(() => {
  return paymentStore.payments.filter(
    p => p.userId === userStore.user?.id && p.status === 'PENDING'
  );
});

const totalPending = computed(() => {
  return pendingPayments.value
    .reduce((sum, p) => sum + p.amount, 0)
    .toFixed(2);
});

const goToPayments = () => {
  router.push('/payments');
};
</script>

<template>
  <div class="payments-widget">
    <router-link to="/payments" class="payments-link">
      <span class="icon">💳</span>
      <span class="label">Mis Pagos</span>
      <span v-if="pendingPayments.length > 0" class="badge">{{ pendingPayments.length }}</span>
    </router-link>

    <div v-if="pendingPayments.length > 0" class="pending-alert">
      <p class="alert-text">Tienes pagos pendientes</p>
      <p class="alert-amount">${{ totalPending }}</p>
      <button @click="goToPayments" class="btn-alert">Ver Pagos</button>
    </div>
  </div>
</template>

<style scoped>
.payments-widget {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.payments-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  color: #333;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.2s;
  position: relative;
}

.payments-link:hover {
  background-color: #f0f0f0;
  color: #42b883;
}

.icon {
  font-size: 18px;
}

.label {
  flex: 1;
  font-weight: 500;
  font-size: 14px;
}

.badge {
  background-color: #ff4444;
  color: white;
  font-size: 11px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.pending-alert {
  background-color: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 6px;
  padding: 10px;
  margin-top: 4px;
}

.alert-text {
  margin: 0 0 4px 0;
  font-size: 12px;
  color: #856404;
  font-weight: 500;
}

.alert-amount {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.btn-alert {
  width: 100%;
  padding: 6px;
  background-color: #ffc107;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  font-size: 12px;
  color: #333;
  transition: background-color 0.2s;
}

.btn-alert:hover {
  background-color: #ffb300;
}
</style>
