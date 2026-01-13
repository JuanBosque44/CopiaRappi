<template>
<div class="container">
    <DriverLayoutView  style="text-align: center;"/>
    <h1>Vista de Ingresos del Conductor</h1>
    <p>Aquí puedes ver un resumen de tus ingresos como conductor.</p>
    <div v-if="orders.lenght">
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
import OrderCard from '../../components/OrderCard.vue';
import { useOrders } from '../../composables/useOrders.js';

const { fetchOrdersByDriver, info, orders } = useOrders();

const userStore = useUserStore();
const user = computed(() => userStore.user);
const totalValue = ref(0);
let fecha = ref(Date)

onMounted(async () => {
  if(orders.lenght === 0)
  await fetchOrdersByDriver(user.value.driverProfileId);
  fecha.value = info.value?.date;
  totalValue.value = orders.value.reduce((acc, order) => acc + order.totalAmount, 0);
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