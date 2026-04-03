<template>
    <div class="vendor-container">
        <h2>Reportes de ventas</h2>
        <VendorLayoutView></VendorLayoutView>
        <!-- REPORTES -->
        <section>
        <h3>Reportes y Estadísticas</h3>
        <div v-if="stats">
            <p>Total pedidos: {{ stats.totalOrders }}</p>
            <p>Ingresos totales: ${{ Number(stats.totalRevenue).toFixed(2) }}</p>
            <p>Pedidos completados: {{ stats.completedOrders }}</p>
        </div>
        <div v-else>
            <p class="error">No hay datos de estadísticas disponibles.</p>
        </div>
        </section>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '../../store/userStore.js';
import axios from 'axios';
import VendorLayoutView from '../../layouts/VendorLayoutView.vue';
import { useAuthError } from '../../composables/useAuthError.js';

const userStore = useUserStore();
const { captureError } = useAuthError();

const stats = ref(null);

const authHeaders = () => ({ headers: { Authorization: `Bearer ${userStore.token}` } });

const fetchStats = async () => {
  try {
    const { data } = await axios.get(`http://localhost:3000/vendors/${userStore.user.vendorProfileId}/statistics`, authHeaders());
    stats.value = { 
        totalRevenue: Number(data.totalSales || 0), 
        totalOrders: data.totalOrders || 0, 
        completedOrders: data.completedOrders || 0 
    };
    console.log(stats.value);
  } catch (err) {
    console.error(err);
    stats.value = { totalRevenue: 0, totalOrders: 0, completedOrders: 0 };
  }
};

onMounted(async () => {
    try {
      await fetchStats();
    }
    catch (err) {
      console.error('Error al cargar estadísticas:', err);
      captureError(err);
    }
});

</script>

<style scoped>

</style>