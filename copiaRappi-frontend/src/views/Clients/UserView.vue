<template>
  <div class="user-container">
    

    <div v-if="loading">Cargando órdenes...</div>

    <div class="search-container">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="Buscar restaurante por nombre o categoría"
        @input="searchRestaurants"
      />
      <div v-if="searchResults.length > 0" class="vendors-grid">
        <div v-for="restaurant in searchResults" :key="restaurant.id">
          <div v-if="restaurant.shopName !== 'sin nombre'">
            <VendorCard :vendor="restaurant" :is-favorite="favoriteStore.isVendorFavorite(restaurant.id) ? true : false"></VendorCard>
          </div>
        </div>
      </div>
      <div v-else>
        <p>No se encontraron restaurantes.</p>
      </div>
    </div>

    <div v-if="selectedRestaurant">
      <h3>Menú de {{ selectedRestaurant.name }}</h3>
      <ul>
        <li v-for="item in selectedRestaurant.menu" :key="item.id">
          {{ item.name }} - {{ item.price }}$
          <button @click="addToCart(item)">Añadir al carrito</button>
        </li>
      </ul>
    </div>

    <!-- Ver carrito -->
    <div v-if="cart.length > 0">
      <h3>Carrito</h3>
      <ul>
        <li v-for="item in cart" :key="item.id">
          {{ item.name }} - {{ item.quantity }} x {{ item.price }}$
        </li>
      </ul>
      <p>Total: ${{ cartTotal }}</p>
      <button @click="checkout">Finalizar compra</button>
    </div>

    <!-- Error en carga -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useUserStore } from '../../store/userStore.js';
import axios from 'axios';
import VendorCard from '../../components/VendorCard.vue';
import { useFavoriteStore } from '../../store/favoriteStore.js';

const userStore = useUserStore();
const favoriteStore = useFavoriteStore();
const orders = ref([]);
const error = ref('');
const loading = ref(false);
const searchQuery = ref('');
const searchResults = ref([]);
const selectedRestaurant = ref(null);
const cart = ref([]);
const cartTotal = computed(() => {
  return cart.value.reduce((total, item) => total + (item.quantity * item.price), 0);
});

const user = computed(() => userStore.user);
const favorite = ref([]);

// Función para buscar restaurantes
const searchRestaurants = async () => {
  if (!searchQuery.value) {
    fetchRestaurants();
    getFavoriteVendors();
    return;
  }

  const cleanedQuery = searchQuery.value.trim();  
  console.log("Buscando restaurante:", cleanedQuery);

  try {
    // Cambiar la URL para apuntar al endpoint correcto
    const { data } = await axios.get(
      `http://localhost:3000/vendors/name/` + cleanedQuery,  
      {
        headers: { Authorization: `Bearer ${userStore.token}` },
      }
    );
    searchResults.value = data;
  } catch (err) {
    console.error('Error al buscar restaurantes: ', err);
    error.value = 'No se pudo realizar la búsqueda. Intenta nuevamente.';
  }
};


const fetchRestaurants = async () => {
  try {
    const { data } = await axios.get(
      'http://localhost:3000/vendors',
      {
        headers: { Authorization: `Bearer ${userStore.token}` },
      }
    );
    searchResults.value = data || [];
  } catch (err) {
    console.error('Error al buscar restaurantes:', err);
    error.value = 'No se pudieron cargar los restaurantes. Intenta nuevamente.';
  }
};

const getFavoriteVendors = async () => {
    try {
        if (localStorage.getItem('favorites')) {
          favoriteStore.favoriteVendors = JSON.parse(localStorage.getItem('favorites'));
          console.log('Favorite vendors loaded from localStorage');
          favorite.value = favoriteStore.favoriteVendors;
        }
        else {
          favoriteStore.favoriteVendors = await favoriteStore.fetchFavoriteVendors(client.id, userStore.token);
          console.log('Favorite vendors loaded from store');
          favorite.value = favoriteStore.favoriteVendors;
        }
        return favorite.value;
    } catch (err) {
        console.error('Error al obtener restaurantes favoritos:', err);
        return [];
    }
};




// Función para proceder con la compra
const checkout = async () => {
  if (cart.value.length === 0) {
    error.value = 'El carrito está vacío.';
    return;
  }

  try {
    const orderData = {
      userId: user.value.id,
      items: cart.value,
      total: cartTotal.value,
    };
    const { data } = await axios.post('http://localhost:3000/orders', orderData, {
      headers: { Authorization: `Bearer ${userStore.token}` },
    });
    orders.value.push(data); 
    cart.value = []; 
  } catch (err) {
    console.error('Error realizando la compra:', err);
    error.value = 'No se pudo realizar la compra. Intenta nuevamente.';
  }
};



onMounted(() => {
  fetchRestaurants();
});
</script>

<style scoped>
.user-container {
  max-width: 600px;
  margin: auto;
  padding: 1rem;
}

.error-message {
  color: red;
  margin-top: 1rem;
}

.search-container {
  margin-bottom: 1rem;
}

.search-container input {
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 1rem;
}

button {
  padding: 0.5rem 1rem;
  margin-top: 0.5rem;
}

.vendors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

</style>
