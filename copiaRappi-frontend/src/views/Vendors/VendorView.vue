<template>
  <div class="vendor-container">
    <h2>Mi restaurante</h2>
    
    <VendorLayoutView />

    <!-- PERFIL DEL NEGOCIO -->
    <section>
      <h3>🏢 Perfil del negocio</h3>
      <form @submit.prevent="updateVendorProfile">
        <input v-model="vendor.shopName" placeholder="Nombre del negocio" required />
        <textarea v-model="vendor.description" placeholder="Descripción"></textarea>
        <input v-model="vendor.hours" placeholder="Horario" />
        <button type="submit">Actualizar Perfil</button>
      </form>
    </section>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue';
import { useUserStore } from '../../store/userStore.js';
import axios from 'axios';
import VendorLayoutView from '../../layouts/VendorLayoutView.vue';

const userStore = useUserStore();
const vendor = reactive({
  id: userStore.user.vendorProfileId,
  shopName: '',
  description: '',
  hours: ''
});

const authHeaders = () => ({ headers: { Authorization: `Bearer ${userStore.token}` } });


// --- Perfil ---
const updateVendorProfile = async () => {
  try {
    const { data } = await axios.patch(`http://localhost:3000/vendors/${vendor.id}`, vendor, authHeaders());
    Object.assign(vendor, data);
    alert('Perfil actualizado');
  } catch (err) { console.error(err); }
};

const getVendorProfile = async () => {
  try {
    const { data } = await axios.get(`http://localhost:3000/vendors/${vendor.id}`, authHeaders());
    Object.assign(vendor, data);
  } catch (err) {
    console.error(err);
  }
};

onMounted(async () => {
  getVendorProfile();
});
</script>

<style scoped>
.vendor-container { max-width: 800px; margin: 2rem auto; padding: 1rem; background: #f9f9f9; border-radius: 8px; text-align: center; }
section { margin-bottom: 2rem; }
ul { list-style: none; padding: 0; }
li { background: #fff; margin: 0.5rem 0; padding: 0.5rem 1rem; border-radius: 4px; border: 1px solid #ddd; }
button { margin-left: 0.5rem; background-color: #42b883; color: white; border: none; padding: 0.3rem 0.6rem; border-radius: 4px; cursor: pointer; }
button:hover { background-color: #369870; }
.add-product form, section form, .support-form { display: flex; flex-direction: column; gap: 0.5rem; align-items: center; }
input, textarea, select { padding: 0.4rem; font-size: 1rem; width: 80%; max-width: 400px; }
.success { color: green; margin-top: 0.5rem; }
.error { color: red; margin-top: 0.5rem; }
.category-badge { background: #e8f5e9; color: #2e7d32; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.85rem; margin-left: 0.5rem; }
</style>
