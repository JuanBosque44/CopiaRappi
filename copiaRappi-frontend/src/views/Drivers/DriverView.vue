<template>
  <div class="driver-container">
    <DriverLayoutView />
    <div v-if="orders.lenght">
      <OrderCard :orders="orders"/>
    </div>
    <div v-else>
      <p>No tienes órdenes actualmente.</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue';
import { useUserStore } from '../../store';
import DriverLayoutView from '../../layouts/DriverLayoutView.vue';
import OrderCard from '../../components/OrderCard.vue';
import { useOrders } from '../../composables/useOrders.js';

const { fetchOrdersByDriver, orders } = useOrders();

const userStore = useUserStore();

const user = computed(() => userStore.user);

const fetchOrders = async () => {
  if (!user.value) return;

  try {
    if(orders.lenght ===0)
    await fetchOrdersByDriver(user.value.driverProfileId);
  } catch (err) {
    console.warn('⚠️ Error al obtener órdenes del conductor:', err);
    orders.value = {};
  }
};

onMounted(() => {
  fetchOrders(); 
});
</script>

<style scoped>
.driver-container {
  max-width: 600px;
  margin: 2rem auto;
  text-align: center;
  padding: 1rem;
  background: #f0f8ff;
  border-radius: 8px;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  padding: 0.5rem;
  border-bottom: 1px solid #ccc;
}
</style>
