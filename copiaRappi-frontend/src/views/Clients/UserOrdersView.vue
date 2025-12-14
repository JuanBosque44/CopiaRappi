<template>
<div class="container">
  <h2>Mis Órdenes</h2>
      <div v-if="ordersError" class="error-message">{{ ordersError }}</div>
      <div v-else-if="orders.length === 0" class="error-message">No hay órdenes registradas</div>
      <ul v-else>
          <li v-for="order in orders" :key="order.id">
          Orden #{{ order.id }} - {{ order.status }}
          </li>
      </ul>
  <button @click="returnToProfile">Volver</button>
</div>
</template>

<script setup>

import { ref, onMounted, computed } from 'vue';
import { useUserStore } from '../../store';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();

const userStore = useUserStore();

const user = computed(() => userStore.user);

const orders = ref([]);
const ordersError = ref('');

const authHeaders = () => ({ headers: { Authorization: `Bearer ${userStore.token}` } });

onMounted(async () => {
  if (!user.value) return;

  if (user.value.role !== 'ADMIN') {
    try {
      const res = await axios.get(`http://localhost:3000/user/${user.value.id}/orders`, authHeaders());
      orders.value = res.data;
    } catch (err) {
      console.error('Error al cargar órdenes:', err);
      ordersError.value = err.response?.data?.message || 'No se pudieron cargar las órdenes';
    }
  }
  
});

const returnToProfile = async () => {
  router.replace('/profile');
};

</script>

