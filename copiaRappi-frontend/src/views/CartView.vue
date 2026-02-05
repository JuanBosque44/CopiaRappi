<script setup>
import { useCartStore } from '../store/cartStore.js';
import { useUserStore } from '../store/userStore.js';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const cartStore = useCartStore();
const userStore = useUserStore();
const router = useRouter();
const isLoading = ref(false);
const deliveryAddress = ref('');
const deliveryPhone = ref('');
let deliveryCost = ref(5)

console.log(cartStore)

const handleCheckout = async () => {
  if (!deliveryAddress.value.trim()) {
    alert('Por favor ingresa una dirección de entrega');
    return;
  }

  isLoading.value = true;

  try {
    const orderData = {
      items: cartStore.items.map(item => ({
        productId: item.id,
        quantity: item.quantity,
      })),
      totalAmount: Number(cartStore.cartTotal),
      address: deliveryAddress.value,
      userId: userStore.user.id,
    };

    console.log(orderData)

    const response = await axios.post(
      'http://localhost:3000/orders',
      orderData,
      { headers: { Authorization: `Bearer ${userStore.token}` } }
    );

    // Guardar la orden en sesión para la confirmación
    const orderWithId = { ...orderData, id: response.data.id };
    sessionStorage.setItem('pendingOrder', JSON.stringify(orderWithId));

    cartStore.clearCart();
    router.push('/order-confirmation');
  } catch (error) {
    console.error('Error al crear el pedido:', error);
    alert('Error al crear el pedido. Intenta nuevamente.');
  } finally {
    isLoading.value = false;
  }
};

const handleContinueShopping = () => {
  router.back();
};
</script>

<template>
  <div class="cart-container">
    <div class="cart-header">
      <h1>🛒 Tu Carrito</h1>
      <router-link to="/" class="back-link">← Volver</router-link>
    </div>

    <div v-if="cartStore.hasItems" class="cart-content">
      <div class="items-section">
        <h2>{{ cartStore.selectedVendor.name }}</h2>

        <div class="cart-items">
          <div v-for="item in cartStore.items" :key="item.id" class="cart-item">
            <img :src="item.imageUrl || '/hamburguesa.jpg'" :alt="item.name" class="item-image" />

            <div class="item-details">
              <h3>{{ item.name }}</h3>
              <p class="item-description" v-if="item.description">{{ item.description }}</p>
              <p class="item-price">${{ item.price }}</p>
            </div>

            <div class="quantity-control">
              <button @click="cartStore.decreaseQuantity(item.id)" class="btn-qty">-</button>
              <input v-model.number="item.quantity" type="number" min="1" @change="cartStore.saveToLocalStorage()" class="qty-input" />
              <button @click="cartStore.increaseQuantity(item.id)" class="btn-qty">+</button>
            </div>

            <div class="item-total">
              <p>${{ (item.price * item.quantity).toFixed(2) }}</p>
            </div>

            <button @click="cartStore.removeFromCart(item.id)" class="btn-remove">🗑️</button>
          </div>
        </div>
      </div>

      <div class="checkout-section">
        <div class="checkout-card">
          <h3>Resumen del Pedido</h3>

          <div class="summary">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>${{ cartStore.cartSubtotal.toFixed(2) }}</span>
            </div>
            <div class="summary-row">
              <span>Envío:</span>
              <span>${{ deliveryCost }}</span>
            </div>
            <div class="summary-row">
              <span>Impuestos:</span>
              <span>${{ (cartStore.cartSubtotal * 0.1).toFixed(2) }}</span>
            </div>
            <div class="summary-row total">
              <span>Total:</span>
              <span>${{ (parseFloat(cartStore.cartTotal) + deliveryCost + cartStore.cartSubtotal * 0.1).toFixed(2) }}</span>
            </div>
          </div>

          <div class="delivery-info">
            <h4>Información de Entrega</h4>

            <div class="form-group">
              <label>Dirección de Entrega *</label>
              <input type="text" v-model="deliveryAddress" placeholder="Ingresa tu dirección completa" class="form-input">
            </div>

            <div class="form-group">
              <label>Teléfono</label>
              <input
                v-model="deliveryPhone"
                type="tel"
                placeholder="Tu teléfono"
                class="form-input"
              />
            </div>
          </div>

          <div class="action-buttons">
            <button @click="handleContinueShopping" class="btn-secondary" :disabled="isLoading">
              Seguir Comprando
            </button>
            <button @click="handleCheckout" class="btn-primary" :disabled="isLoading">
              {{ isLoading ? 'Procesando...' : 'Realizar Pedido' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-cart">
      <p class="empty-message"> Tu carrito está vacío</p>
      <router-link to="/user" class="btn-continue">Buscar Restaurantes</router-link>
    </div>
  </div>
</template>

<style scoped>
.cart-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 20px;
}

.cart-header h1 {
  margin: 0;
  color: #333;
}

.back-link {
  color: #42b883;
  text-decoration: none;
  font-weight: bold;
  transition: color 0.2s;
}

.back-link:hover {
  color: #369870;
}

.cart-content {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 30px;
}

.items-section h2 {
  margin: 0 0 20px 0;
  color: #42b883;
  font-size: 18px;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cart-item {
  display: grid;
  grid-template-columns: 80px 1fr 120px 80px 40px;
  gap: 16px;
  align-items: center;
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.cart-item:hover {
  background-color: #f5f5f5;
}

.item-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
}

.item-details h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #333;
}

.item-description {
  margin: 0;
  font-size: 12px;
  color: #999;
}

.item-price {
  margin: 8px 0 0 0;
  font-weight: bold;
  color: #42b883;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-self: center;
}

.btn-qty {
  background-color: white;
  border: 1px solid #ddd;
  width: 30px;
  height: 30px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.btn-qty:hover {
  background-color: #42b883;
  color: white;
  border-color: #42b883;
}

.qty-input {
  width: 50px;
  text-align: center;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px;
  font-weight: bold;
}

.qty-input:focus {
  outline: none;
  border-color: #42b883;
}

.item-total {
  text-align: right;
  font-weight: bold;
  color: #333;
  font-size: 16px;
}

.btn-remove {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-remove:hover {
  opacity: 0.7;
}

.checkout-section {
  position: sticky;
  top: 20px;
  height: fit-content;
}

.checkout-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.checkout-card h3 {
  margin: 0 0 16px 0;
  color: #333;
}

.summary {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}

.summary-row.total {
  font-weight: bold;
  font-size: 16px;
  color: #333;
}

.delivery-info {
  margin-bottom: 20px;
}

.delivery-info h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #333;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: bold;
  color: #666;
}

.form-input {
  width: 95%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 13px;
}

.form-input:focus {
  outline: none;
  border-color: #42b883;
  box-shadow: 0 0 0 2px rgba(66, 184, 131, 0.1);
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-primary,
.btn-secondary {
  padding: 12px;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.btn-primary {
  background-color: #42b883;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #369870;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #f0f0f0;
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.empty-cart {
  text-align: center;
  padding: 60px 20px;
}

.empty-message {
  font-size: 24px;
  color: #999;
  margin-bottom: 20px;
}

.btn-continue {
  display: inline-block;
  padding: 12px 30px;
  background-color: #42b883;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-weight: bold;
  transition: background-color 0.2s;
}

.btn-continue:hover {
  background-color: #369870;
}

@media (max-width: 768px) {
  .cart-content {
    grid-template-columns: 1fr;
  }

  .cart-item {
    grid-template-columns: 60px 1fr 30px;
  }

  .item-image {
    width: 60px;
    height: 60px;
  }

  .quantity-control,
  .item-total {
    display: none;
  }

  .checkout-section {
    position: static;
  }
}
</style>
