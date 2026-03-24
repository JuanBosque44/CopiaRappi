<script setup>
defineProps({
    product: {
        type: Object,
        required: true
    }
});

const defaultImageUrl = '/hamburguesa.jpg';
</script>

<template>
<div class="product-card">
    <img :src="product.imageUrl || defaultImageUrl" :alt="product.name" class="product-image" />
    <h3>{{ product.name }}</h3>
    <p>Precio: {{ product.price }}$</p>
    <button @click="$emit('add-to-cart', product)">+</button>
</div>
</template>

<style scoped>
.product-card {
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 16px;
    margin: 16px;
    width: 200px;
}

.product-image {
    width: 100%;
    height: auto;
    border-radius: 4px;
}
</style>