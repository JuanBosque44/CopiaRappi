import { defineStore } from 'pinia';

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: JSON.parse(localStorage.getItem('cart')) || [],
    selectedVendor: JSON.parse(localStorage.getItem('selectedVendor')) || null,
  }),

  getters: {
    cartCount: (state) => state.items.length,
    
    cartTotal: (state) => {
      return state.items.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
    },

    cartSubtotal: (state) => {
      return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    itemsByVendor: (state) => {
      return state.items.filter(item => item.vendorId === state.selectedVendor?.id);
    },

    hasItems: (state) => state.items.length > 0,

    vendorHasItems: (state) => (vendorId) => {
      return state.items.some(item => item.vendorId === vendorId);
    },
  },

  actions: {
    addToCart(product, vendorId, vendorName) {
      // Si cambiamos de vendor, limpiar carrito anterior
      if (this.selectedVendor && this.selectedVendor.id !== vendorId) {
        const confirmChange = confirm(
          `Cambiarás de restaurante. Tu carrito anterior será eliminado. ¿Continuar?`
        );
        if (!confirmChange) return;
        this.clearCart();
      }

      // Establecer vendor seleccionado
      if (!this.selectedVendor) {
        this.selectedVendor = { id: vendorId, name: vendorName };
        localStorage.setItem('selectedVendor', JSON.stringify(this.selectedVendor));
      }

      // Buscar si el producto ya existe
      const existingItem = this.items.find(item => item.id === product.id);

      if (existingItem) {
        existingItem.quantity++;
      } else {
        this.items.push({
          id: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          vendorId: vendorId,
          quantity: 1,
          description: product.description || '',
        });
      }

      this.saveToLocalStorage();
    },

    removeFromCart(productId) {
      this.items = this.items.filter(item => item.id !== productId);
      if (this.items.length === 0) {
        this.clearCart();
      }
      this.saveToLocalStorage();
    },

    updateQuantity(productId, quantity) {
      const item = this.items.find(item => item.id === productId);
      if (item) {
        if (quantity <= 0) {
          this.removeFromCart(productId);
        } else {
          item.quantity = quantity;
          this.saveToLocalStorage();
        }
      }
    },

    increaseQuantity(productId) {
      const item = this.items.find(item => item.id === productId);
      if (item) {
        item.quantity++;
        this.saveToLocalStorage();
      }
    },

    decreaseQuantity(productId) {
      const item = this.items.find(item => item.id === productId);
      if (item && item.quantity > 1) {
        item.quantity--;
        this.saveToLocalStorage();
      } else if (item) {
        this.removeFromCart(productId);
      }
    },

    clearCart() {
      this.items = [];
      this.selectedVendor = null;
      localStorage.removeItem('cart');
      localStorage.removeItem('selectedVendor');
    },

    saveToLocalStorage() {
      localStorage.setItem('cart', JSON.stringify(this.items));
    },

    restoreFromLocalStorage() {
      const savedCart = localStorage.getItem('cart');
      const savedVendor = localStorage.getItem('selectedVendor');
      if (savedCart) {
        this.items = JSON.parse(savedCart);
      }
      if (savedVendor) {
        this.selectedVendor = JSON.parse(savedVendor);
      }
    },
  },
});
