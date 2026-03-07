<template>
  <div class="profile-container">
    <h1>Mi Perfil</h1>
    <nav style="margin-bottom: 2%;" v-if="user.role !== 'ADMIN'">
     <router-link to="/user/orders" v-if="user.role === 'CLIENT'">Mis Órdenes </router-link> 
     <router-link to="/driver" v-if="user.role === 'DRIVER'">Entregas </router-link> 
     <router-link to="/vendor" v-if="user.role === 'VENDOR'">Mi Negocio </router-link>
     | <router-link to="/user/support">Soporte</router-link>
    </nav>

    <div v-if="user">
      <form @submit.prevent="updateProfile">
        <input v-model="name" placeholder="Nombre" required />
        <input v-model="email" type="email" placeholder="Email" required />
        <!--
          <input v-model="password" type="password" placeholder="Contraseña" />
        -->
        <input v-if="user.role === 'CLIENT'" v-model="address" type="text" placeholder="Dirección">
        <div v-if="user.role === 'DRIVER'">
          <DriverForm v-model:phone="phone" v-model:vehicleType="vehicleType" v-model:licensePlate="licensePlate" v-model:vehicleBrand="vehicleBrand" v-model:vehicleModel="vehicleModel" v-model:driverLicense="driverLicense" />
        </div>
        <button type="submit" :disabled="loading">Actualizar Perfil</button>
      </form>
      <p v-if="profileMessage" :class="{ error: profileError }">{{ profileMessage }}</p>


      <ul v-if="user.role === 'CLIENT'">
        <h2>Negocios Favoritos</h2>
        <span v-if="favoriteVendors?.length === 0" class="error-message">No hay restaurantes marcados como favoritos</span>
        <li v-for="vendor in favoriteVendors" :key="vendor.id">
          {{ vendor.shopName }}
          <button @click="toggleFavorite(vendor.id)" :disabled="loadingFavorites" class="right-side-btn">
            Quitar
          </button>
        </li>
      </ul>

      <div v-if="user.role === 'DRIVER'" class="profile-container">
        <h2>Actividad</h2>
        <div class="available">
          <label for="disponibilidad">Disponible:</label>
          <input type="checkbox" id="disponibilidad" v-model="available" @change="changeAvailability" />
        </div>
      </div>

      <button @click="logout">Cerrar sesión</button>
    </div>

    <div v-else>
      <p>No has iniciado sesión.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useUserStore } from '../store/userStore.js';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useFavoriteStore } from '../store/favoriteStore';
import DriverForm from '../components/DriverForm.vue';

const userStore = useUserStore();
const router = useRouter();
const favoriteStore = useFavoriteStore();

const user = computed(() => userStore.user);
const name = ref(user.value?.name || '');
const email = ref(user.value?.email || '');
const address = ref(user.value?.address?.street || '');
const password = ref('');
const favoriteVendors = ref([]);

let phone = ref('');
let vehicleType = ref('');
let licensePlate = ref('');
let vehicleBrand = ref('');
let vehicleModel = ref('');
let driverLicense = ref('');

const profileMessage = ref('');
const profileError = ref(false);
const loading = ref(false);
const loadingFavorites = ref(false);

const available = ref(true);

const authHeaders = () => ({ headers: { Authorization: `Bearer ${userStore.token}` } });

onMounted(async () => {
  if (!user.value) return;

  if (user.value.role === 'CLIENT') {
    try {
      await fetchFavoriteVendors();
    } catch (err) {
      console.error('Error al cargar favoritos:', err);
    }
  }

  if (user.value.role === 'DRIVER') {
    await getAvailable();
  }
});

const updateProfile = async () => {
  loading.value = true;
  profileMessage.value = '';
  profileError.value = false;

  const DriverData = {
    phone: phone.value,
    vehicleType: vehicleType.value,
    licensePlate: licensePlate.value,
    vehicleBrand: vehicleBrand.value,
    vehicleModel: vehicleModel.value,
    driverLicense: driverLicense.value
  };

  try {
    let body = { name: name.value, email: email.value, address: address.value };
    if(DriverData && user.value.role === 'DRIVER') body.driverProfile = DriverData;
    console.log(body)
    const res = await axios.put(`http://localhost:3000/user/${user.value.id}`, body, authHeaders());
    userStore.user = res.data;
    localStorage.setItem('user', JSON.stringify(res.data));

    profileMessage.value = '¡Perfil actualizado correctamente!';
  } catch (err) {
    console.error('Error al actualizar perfil:', err);
    profileMessage.value = 'No se pudo actualizar el perfil';
    profileError.value = true;
  } finally {
    loading.value = false;
    password.value = '';
  }
};

const changeAvailability = async () => {
  try {
    await axios.put(`http://localhost:3000/drivers/${user.value.driverProfileId}`, { isActive: available.value }, authHeaders());
    profileMessage.value = 'Disponibilidad actualizada correctamente: ' + (available.value ? 'Disponible' : 'No Disponible');
  } catch (err) {
    console.error('Error al cambiar disponibilidad:', err);
    alert('No se pudo cambiar la disponibilidad');
    available.value = !available.value; // Revertir el cambio en caso de error
  }
};

const getAvailable = async () => {
  try {
    const res = await axios.get(`http://localhost:3000/drivers/${user.value.driverProfileId}`, authHeaders());
    available.value = res.data.isActive;

    phone.value = res.data.phone || '';
    vehicleType.value = res.data.vehicleType || '';
    licensePlate.value = res.data.licensePlate || '';
    vehicleBrand.value = res.data.vehicleBrand || '';
    vehicleModel.value = res.data.vehicleModel || '';
    driverLicense.value = res.data.driverLicense || '';
  } catch (err) {
    console.error('Error al obtener disponibilidad:', err);
  }
};

const toggleFavorite = async (vendorId) => {
  loadingFavorites.value = true;
  try {
    console.log('Toggling favorite for vendor ID:', vendorId , 'and user ID:', user.value.id);
    await favoriteStore.toggleFavorite(vendorId, user.value.id, userStore.token);
    favoriteVendors.value = favoriteVendors.value.filter(vendor => vendor.id !== vendorId);
  } catch (err) {
    console.error('Error al actualizar favorito:', err);
    alert('No se pudo actualizar el favorito');
  } finally {
    loadingFavorites.value = false;
  }
};

const fetchFavoriteVendors = async () => {
  loadingFavorites.value = true;
  try {
    if(favoriteStore.favoriteVendors?.length !== 0) {
      if(localStorage.getItem('favorites')) {
        favoriteStore.favoriteVendors = JSON.parse(localStorage.getItem('favorites'));
        console.log('Favorite vendors loaded from localStorage');
        favoriteVendors.value = favoriteStore.favoriteVendors;
      } else {
        favoriteStore.favoriteVendors = await favoriteStore.fetchFavoriteVendors(user.value.id, userStore.token);
        favoriteVendors.value = favoriteStore.favoriteVendors;
        console.log('Favorite vendors loaded from store');
      }
    }
  } catch (err) {
    console.error('Error al cargar restaurantes favoritos:', err);
  }
  finally {
    loadingFavorites.value = false;
    if (favoriteVendors.value?.length === 0 || !favoriteVendors.value) {
      console.log('No hay restaurantes favoritos para este usuario');
    }
  }
};

const logout = () => {
  userStore.logout();
  router.replace('/login');
};
</script>

<style scoped>
.profile-container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 1rem;
  text-align: center;
  border-radius: 8px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

input {
  padding: 0.5rem;
  font-size: 1rem;
}

.available {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

#disponibilidad {
  width: 20px;
  height: 20px;
  cursor: pointer;
}


ul {
  list-style: none;
  padding: 0;
}

ul li {
  margin: 0.5rem 0;
  background: #fff;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.error-message, .error {
  color: red;
  margin-top: 0.5rem;
}

.right-side-btn {
  margin-left: auto;
  padding: 5px 10px;
  font-size: 0.9rem;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

ul li {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

</style>
