<script setup>
import { computed } from 'vue';
import { useCartStore } from '../store/cartStore.js';

const cartStore = useCartStore();

const cartCount = computed(() => cartStore.cartCount);
const isOpen = ref(false);

const toggleCart = () => {
  isOpen.value = !isOpen.value;
};

import { ref } from 'vue';
</script>

<template>
  <div class="cart-floating">
    <button class="cart-btn" @click="toggleCart">
      <span class="cart-icon">🛒</span>
      <span class="cart-badge">{{ cartCount }}</span>
    </button>

    <transition name="slide">
      <div v-if="isOpen" class="cart-preview">
        <div class="cart-header">
          <h3>Tu Carrito</h3>
          <button class="close-btn" @click="toggleCart">✕</button>
        </div>

        <div class="cart-items-preview">
          <div v-for="item in cartStore.items" :key="item.id" class="cart-item-mini">
            <div class="item-info">
              <p class="item-name">{{ item.name }}</p>
              <p class="item-price">${{ (item.price * item.quantity).toFixed(2) }}</p>
            </div>
            <div class="item-quantity">{{ item.quantity }}x</div>
          </div>
        </div>

        <div class="cart-footer">
          <div class="total">
            <strong>Total:</strong>
            <strong>${{ cartStore.cartTotal }}</strong>
          </div>
          <router-link to="/cart" class="btn-checkout">Ver Carrito</router-link>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.cart-floating {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 100;
  width: fit-content;
}

.cart-btn {
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(66, 184, 131, 0.4);
  transition: all 0.3s;
  position: relative;
}

.cart-btn:hover {
  background-color: #369870;
  box-shadow: 0 6px 16px rgba(66, 184, 131, 0.6);
  transform: scale(1.05);
}

.cart-icon {
  display: block;
}

.cart-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #e74c3c;
  color: white;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 12px;
}

.cart-preview {
  position: absolute;
  bottom: 80px;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  width: 320px;
  max-height: 400px;
  display: flex;
  flex-direction: column;
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.cart-header h3 {
  margin: 0;
  font-size: 16px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
}

.cart-items-preview {
  flex: 1;
  overflow-y: auto;
  padding: 12px 0;
}

.cart-item-mini {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
}

.item-info {
  flex: 1;
}

.item-name {
  margin: 0;
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.item-price {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: #42b883;
  font-weight: bold;
}

.item-quantity {
  font-size: 12px;
  color: #999;
  font-weight: 600;
}

.cart-footer {
  padding: 16px;
  border-top: 1px solid #f0f0f0;
  background-color: #f9f9f9;
  border-radius: 0 0 8px 8px;
}

.total {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
}

.btn-checkout {
  display: block;
  width: 90%;
  padding: 10px;
  background-color: #42b883;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  text-align: center;
  font-weight: bold;
  transition: background-color 0.2s;
}

.btn-checkout:hover {
  background-color: #369870;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
