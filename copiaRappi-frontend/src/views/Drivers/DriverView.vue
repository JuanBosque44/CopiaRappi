<template>
  <div class="driver-container">
    <DriverLayoutView />
    <div v-if="orders.length">
      <h2>Mis Órdenes</h2>
      <li v-for="order in orders" :key="order.id">
        <OrderCard :orders="[order]" />
      </li>
    </div>
    <div v-else>
      <p>No tienes órdenes actualmente.</p>
    </div>
    <div>
      <h2>Órdenes Disponibles</h2>
      <li v-for="order in availableOrders.data" :key="order.id">
        <OrderCard :orders="[order]" @acceptOrder="acceptOrder" />
      </li>
      <button v-if="availableOrders?.meta" @click="prevPage">Anterior</button>
      <button v-if="availableOrders?.meta" @click="nextPage">Siguiente</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue';
import { useUserStore } from '../../store/userStore.js';
import DriverLayoutView from '../../layouts/DriverLayoutView.vue';
import OrderCard from '../../components/OrderCard.vue';
import { useOrders } from '../../composables/useOrders.js';

const { fetchOrdersByDriver, orders, availableOrders, fetchAvailableOrders, acceptOrderApi } = useOrders();

const userStore = useUserStore();

const user = computed(() => userStore.user);
const page = ref(1);

const fetchOrders = async () => {
  if (!user.value) return;

  try {
    await fetchOrdersByDriver(user.value.driverProfileId);
    console.log('Órdenes del conductor:', orders.value);
  } catch (err) {
    console.warn('⚠️ Error al obtener órdenes del conductor:', err);
    orders.value = [];
  }
};

const fetchAvailable = async () => {
  if (!user.value) return;

  try {
    await fetchAvailableOrders();
  } catch (err) {
    console.warn('⚠️ Error al obtener órdenes disponibles:', err);
    availableOrders.value = [];
  }
};

const acceptOrder = async (orderOrId) => {
  if (!user.value || !user.value.driverProfileId) return;

  let order;
  if (Array.isArray(orderOrId)) {
    if (!orderOrId.length) {
      console.warn('⚠️ Orden no válida (array vacío):', orderOrId);
      return;
    }

    if (orderOrId.length > 1) {
      console.warn('⚠️ Se recibió una lista en lugar de una orden, usando el primer elemento:', orderOrId);
    }

    order = orderOrId[0];
  } else if (orderOrId && typeof orderOrId === 'object') {
    order = orderOrId;
  } else {
    order = availableOrders.value.find((o) => o.id === orderOrId);
  }

  const orderId = order?.id ?? orderOrId;

  if (!orderId) {
    console.warn('⚠️ Orden no válida para aceptar:', orderOrId);
    return;
  }

  if (order?.driver) {
    console.warn('⚠️ La orden ya tiene un conductor asignado.');
    return;
  }

  try {
    console.log('Intentando aceptar la orden ID:', orderId, 'obj:', order);
    await acceptOrderApi(orderId);
    await fetchOrders();
    await fetchAvailable();
  } catch (err) {
    console.warn('⚠️ Error al aceptar la orden:', err);
  }
};

const nextPage = () => {
  if (availableOrders.value.meta.page < availableOrders.value.meta.pages) {
    page.value++;
    fetchAvailableOrders(page.value);
  }
};

const prevPage = () => {
  if (availableOrders.value.meta.page > 1) {
    page.value--;
    fetchAvailableOrders(page.value);
  }
};

onMounted(() => {
  fetchOrders(); 
  fetchAvailable();
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
