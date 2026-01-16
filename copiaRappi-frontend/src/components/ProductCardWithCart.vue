<script setup>
import { computed } from 'vue';
import { useCartStore } from '../store/cartStore.js';

const cartStore = useCartStore();

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
  vendorId: {
    type: Number,
    required: true,
  },
  vendorName: {
    type: String,
    required: true,
  },
});

const cartItem = computed(() => {
  return cartStore.items.find(item => item.id === props.product.id);
});

const handleAddToCart = () => {
  cartStore.addToCart(props.product, props.vendorId, props.vendorName);
};
</script>

<template>
  <div class="product-card">
    <img :src="product.imageUrl || '/hamburguesa.jpg'" :alt="product.name" class="product-image" />
    <div class="product-info">
      <h3>{{ product.name }}</h3>
      <p class="description" v-if="product.description">{{ product.description }}</p>
      <div class="footer">
        <span class="price">${{ product.price.toFixed(2) }}</span>
        <div v-if="cartItem" class="quantity-control">
          <button @click="cartStore.decreaseQuantity(product.id)" class="btn-quantity">-</button>
          <span class="quantity">{{ cartItem.quantity }}</span>
          <button @click="cartStore.increaseQuantity(product.id)" class="btn-quantity">+</button>
        </div>
        <button v-else @click="handleAddToCart" class="btn-add">+</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin: 16px;
  width: 220px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.product-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 12px;
}

.product-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

h3 {
  margin: 8px 0;
  font-size: 16px;
  color: #333;
}

.description {
  font-size: 12px;
  color: #666;
  margin: 4px 0;
  flex-grow: 1;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.price {
  font-weight: bold;
  font-size: 18px;
  color: #42b883;
}

.btn-add {
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 18px;
  transition: background-color 0.2s;
}

.btn-add:hover {
  background-color: #369870;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 4px 8px;
}

.btn-quantity {
  background-color: white;
  border: 1px solid #ddd;
  width: 24px;
  height: 24px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn-quantity:hover {
  background-color: #f0f0f0;
}

.quantity {
  min-width: 20px;
  text-align: center;
  font-weight: bold;
}
</style>
