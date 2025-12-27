<template>
<div class="vendor-container">
    <h2>Pedidos</h2>
    <VendorLayoutView></VendorLayoutView>

    <!-- PEDIDOS -->
    <section>
        <h3>Historial</h3>
        <div v-if="loadingOrders">Cargando pedidos...</div>
        <ul v-else-if="orders.length">
            <li v-for="o in orders" :key="o.id">
            Pedido #{{ o.id }} - {{ o.status }} - ${{ Number(o.totalAmount).toFixed(2) }}
            <button @click="viewOrderDetails(o.id)">Ver detalles</button>
            <select v-model="o.status" @change="changeOrderStatus(o.id, o.status)" style="margin-left: 1.2%;">
                <option value="PENDING">Pendiente</option>
                <option value="IN_PROGRESS">En progreso</option>
                <option value="COMPLETED">Completado</option>
                <option value="CANCELLED">Cancelado</option>
            </select>
            </li>
        </ul>
        <p v-else>No tienes pedidos actualmente.</p>
    </section>


    <!-- DETALLES DEL PEDIDO -->
    <section v-if="selectedOrder">
      <h3>Detalles del Pedido #{{ selectedOrder.id }}</h3>
      <ul>
        <li v-for="item in selectedOrder.items" :key="item.id">
          {{ item.name }} x {{ item.quantity }} — ${{ Number(item.price).toFixed(2) }}
        </li>
      </ul>
      <p>Total: ${{ Number(selectedOrder.total).toFixed(2) }}</p>
      <button @click="selectedOrder = null">Cerrar</button>
    </section>
</div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '../../store';
import axios from 'axios';
import VendorLayoutView from '../../layouts/VendorLayoutView.vue';

const userStore = useUserStore();
const orders = ref([]);
const selectedOrder = ref(null);
const loadingOrders = ref(false);

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${userStore.token}`
  }
});


const fetchOrders = async () => {
  loadingOrders.value = true;
  try {
    const { data } = await axios.get(`http://localhost:3000/orders?vendorId=${userStore.user.vendorProfileId}`, authHeaders());
    orders.value = data.map(o => ({ ...o, total: Number(o.total) }));
  } catch (err) { console.error(err); }
  finally { loadingOrders.value = false; }
};

const viewOrderDetails = async (id) => {
  try {
    const { data } = await axios.get(`http://localhost:3000/orders/${id}/summary`, authHeaders());
    console.log(data);
    selectedOrder.value = {
      ...data,
      total: Number(data.totalAmount),
      items: data.items.map(i => ({ ...i, total: Number(i.total) })),
      id: id
    };
    console.log(selectedOrder.value);
  } 
  catch (err) {
    console.error(err);
  }
};

const changeOrderStatus = async (id, status) => {
  try { 
        await axios.put(`http://localhost:3000/orders/${id}`, { status }, authHeaders());
    }
  catch (err) {
        console.error(err);
    }
};

onMounted(() => {
  fetchOrders();
});

</script>

<style scoped>

</style>