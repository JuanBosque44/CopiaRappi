<script setup>
import { computed, defineProps, onMounted, ref } from 'vue';
import { useUserStore } from '../store/userStore.js';
import { useFavoriteStore } from '../store/favoriteStore.js';
import { useAuthError } from '../composables/useAuthError.js';

const userStore = useUserStore();
const favoriteStore = useFavoriteStore();
const { captureError } = useAuthError();

let { vendor } = 
defineProps({
    vendor: {
        type: Object,
        required: true
    },
    isFavorite: {
        type: Boolean,
        required: false,
        default: false
    }
});

const client = userStore.user;
const averageRating = ref('')
let classFavorite = ref('')

onMounted(() => {
    try {
        averageCalculated()
        const isFavorite = computed(() => favoriteStore.isVendorFavorite(vendor.id)).value;
        if(!isFavorite) classFavorite.value = 'fav'
        else classFavorite.value = 'fav-added'
    } catch (err) {
        console.error('Error al cargar el vendor:', err);
        captureError(err);
    }

});



const averageCalculated = () => {
    if (!vendor || !vendor.reviews || vendor.reviews.length === 0) {
        averageRating.value = 0;
        return;
    }
    let sum = 0;
    vendor.reviews.forEach(review => {
        sum += review.rating;
    });
    averageRating.value = ( sum / vendor.reviews.length).toFixed(1);
}

const toggleFavoriteVendor = async () => {
    try {
        await favoriteStore.toggleFavorite(vendor.id, client.id, userStore.token);
        const isFavorite = await computed(() => favoriteStore.isVendorFavorite(vendor.id)).value;
        if(isFavorite) classFavorite.value = 'fav-added'
        else classFavorite.value = 'fav'
    } catch (err) {
        console.error('Error al marcar restaurante como favorito:', err);
    }
};

</script>

<template>
    <div class="vendor-card">
        <div class="vendor-header">
            <h2>
                <RouterLink :to="`/vendors/${vendor.id}`">
                    {{ vendor.shopName }}
                </RouterLink>
            </h2>
            <button :class="classFavorite" @click="toggleFavoriteVendor">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-star" viewBox="0 0 16 16">
                    <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.56.56 0 0 0-.163-.505L1.71 6.745l4.052-.576a.53.53 0 0 0 .393-.288L8 2.223l1.847 3.658a.53.53 0 0 0 .393.288l4.052.575-2.906 2.77a.56.56 0 0 0-.163.506l.694 3.957-3.686-1.894a.5.5 0 0 0-.461 0z"/>
                </svg>
            </button>
        </div>
        <span class="calificacion">Calificación: {{ averageRating }} ★</span>
    </div>
</template>

<style scoped>
.vendor-card {
    border: 1px solid #ccc;
    padding: 16px;
    border-radius: 8px;
    margin-top: 2%;
    margin-bottom: 2%;
}

.vendor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.vendor-card h2 {
    font-size: 1.1rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
}

.vendor-card .fav {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    background-color: gold;
}

.vendor-card .fav-added {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    background-color: red;
}

.vendor-card .fav:hover {
    background-color: darkorange;
    transition: background-color 0.3s ease;
}

.vendor-card .fav-added:hover {
    background-color: darkred;
    transition: background-color 0.3s ease;
}

.vendor-card .calificacion {
    display: block;
    margin-top: 8px;
    font-size: 14px;
    color: #555;
}
</style>