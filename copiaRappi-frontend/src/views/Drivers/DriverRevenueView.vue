<template>
<div class="container">
    <DriverLayoutView  style="text-align: center;"/>
    <h1>Vista de Ingresos del Conductor</h1>
    <p>Aquí puedes ver un resumen de tus ingresos como conductor.</p>
    <div v-if="orders">
        <h2>Resumen de Ingresos</h2>
        <OrderCard :orders="orders" :fecha="fecha"/>
    <div>
        <h3>Total de Ingresos:  <span :class="totalValue >= 0 ? 'color-positive' : 'color-negative'"> $ {{ totalValue }}</span></h3>
    </div>
    </div>
    <div v-else>
        <p>No tienes órdenes actualmente.</p>
    </div>
</div>
</template>

<script setup>
import DriverLayoutView from '../../layouts/DriverLayoutView.vue';

import { ref, onMounted, computed } from 'vue';
import { useUserStore } from '../../store';
import axios from 'axios';
import OrderCard from '../../components/OrderCard.vue';

const userStore = useUserStore();
const orders = ref({});
const user = computed(() => userStore.user);
const totalValue = ref(0);
let fecha = ref(Date)

const fetchOrders = async () => {
  if (!user.value) return;

  try {
    const { data } = await axios.get(
      `http://localhost:3000/drivers/${user.value.driverProfileId}/orders`,
      {
        headers: {
          Authorization: `Bearer ${userStore.token}`,
        },
      }
    );
    orders.value = data || {};
    fecha.value = new Date(orders.value.date).toLocaleDateString('es-AR', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
    });
  } catch (err) {
    console.warn('⚠️ Error al obtener órdenes del conductor:', err);
    orders.value = {};
  }
};

onMounted(async () => {
  await fetchOrders();
  totalValue.value = orders.value.orders.reduce((acc, order) => acc + order.totalAmount, 0);
});

</script>

<style scoped>

.color-positive {
    color: green;
}
.color-negative {
    color: red;
}
</style>