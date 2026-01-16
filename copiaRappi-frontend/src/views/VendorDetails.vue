<script setup>
import axios from 'axios';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '../store/index.js';
import ProductCard from '../components/ProductCard.vue';
import { useCartStore } from '../store/cartStore.js';

const userStore = useUserStore();
const route = useRoute();
const cartStore = useCartStore();
const cart = ref(cartStore.items);

const routeValue = Number(route.params.vendorId);
let vendorsData = ref({});
const rating = ref(0);
const comment = ref('');
const error = ref(null);

onMounted(() => {
    fetchVendor();
})

const fetchVendor = async () =>{
    try{
        const vendorData = await axios.get('http://localhost:3000/vendors/'+ routeValue, {}, { headers: { Authorization: `Bearer ${userStore.token}` } })
        vendorsData.value = vendorData.data;
        console.log(vendorsData.value)
    }
    catch(Error){
        console.log('No se ha encontrado el restaurante: '+ Error)
    }
}

const setRating = (star) => {
    rating.value = star;
};

const submitReview = async () => {
    try{
        if (!validateReview()) {
            return;
        }
        console.log('Enviando reseña:', {
            vendorId: routeValue,
            rating: rating.value,
            comment: comment.value,
        });
        const data = await axios.post('http://localhost:3000/reviews', {
            vendorId: routeValue,
            rating: rating.value,
            comment: comment.value,
        }, { headers: { Authorization: `Bearer ${userStore.token}` } });
        console.log(data)
        error.value = null;
        rating.value = 0;
        comment.value = '';
        vendorsData.value.reviews.push(data.data);
    }
    catch(Error){
        console.log('Error al enviar la reseña: '+ Error)
        error.value = 'Error al enviar la reseña.';
    }
};

const validateReview = () => {
    if (rating.value < 1 || rating.value > 5) {
        error.value = 'Por favor, selecciona una calificación válida entre 1 y 5.';
        return false;
    }
    error.value = null;
    return true;
};

const deleteReview = async (reviewId) => {
    try {
        await axios.delete(`http://localhost:3000/reviews/${reviewId}`, {
            headers: { Authorization: `Bearer ${userStore.token}` },
        });
        vendorsData.value.reviews = vendorsData.value.reviews.filter(review => review.id !== reviewId);
    } catch (err) {
        console.error('Error al eliminar la reseña:', err);
    }
};

const addToCart = (item) => {
    const vendor = {
        id: vendorsData.value.id,
        shopName: vendorsData.value.shopName
    }
    
    cartStore.addToCart(item, vendor.id, vendor.shopName)
};
    
</script>

<template>
<div class="vendor-card">
    <h2>{{ vendorsData.shopName }}</h2>
    <div class="vendor-products">
        <h3>Productos:</h3>
        <div v-if="vendorsData.products && vendorsData.products.length > 0">
            <div v-for="product in vendorsData.products" :key="product.id">
                <ProductCard :product="product" @add-to-cart="addToCart(product)"></ProductCard>
            </div>
        </div>
        <div v-else>
            <p>No hay productos disponibles.</p>
        </div>
    </div>

   
    <div class="review-card">
        <div class="rating">
            <span
            v-for="star in 5"
            :key="star"
            class="star"
            :class="{ active: star <= rating }"
            @click="setRating(star)"
            >
            ★
            </span>
            <p>Calificación seleccionada: {{ rating }}</p>
            <div class="review">
                <label for="reviews">Comentario: </label>
                <input id="reviews" v-model="comment" type="text" placeholder="Escribe tu reseña aquí..." />
            </div>
            <button @click="submitReview()">Enviar reseña</button>
            <div v-if="error" class="error">{{ error }}</div>
        </div>
    </div>

    <div class="other-reviews">
        <h3>Otras Reseñas:</h3>
        <div v-if="vendorsData.reviews && vendorsData.reviews.length > 0">
            <div v-for="review in vendorsData.reviews" :key="review.id" class="review-card">
                <span class="deleteComment" v-if="review.user.id === userStore.user.id || userStore.user.role === 'ADMIN'"
                @click="deleteReview(review.id)">x</span>
                <p>{{ review.user.name }}</p>
                <p>Calificación: {{ review.rating }} ★</p>
                <p v-if="review.comment">Comentario: {{ review.comment }}</p>
            </div>
        </div>
        <div v-else>
            <p>No hay reseñas disponibles.</p>
        </div>
    </div>
</div>

</template>

<style scoped>
.vendor-card {
    border: 1px solid #ccc;
    padding: 1rem;
    margin: 1rem;
    border-radius: 8px;
    background-color: #f9f9f9;
}

.vendor-products {
    margin-top: 1rem;
    margin-bottom: 500px;

}

other-reviews {
    margin-top: 2rem;
}


.review-card {
    margin-top: 2rem;
    padding: 1rem;
    border: 1px solid #cccccc;
    border-radius: 8px;
    text-align: center;
    background-color: lightgray;
}

.star {
    font-size: 2rem;
    color: darkgray;
    cursor: pointer;
}
.star.active {
    color: gold;
}
.review {
    margin-top: 1rem;
}

.deleteComment {
    float: right;
    cursor: pointer;
    color: darkgray;
}
.deleteComment:hover {
    color: red;
}

</style>