import { defineStore } from 'pinia';
import { computed } from 'vue';
import axios from 'axios';


export const useFavoriteStore = defineStore('favorite', {
    state: () => {
        try {
            const stored = localStorage.getItem('favorites');
            return {
                favoriteVendors: stored ? JSON.parse(stored) : [],
                isLoading: false,
                error: null,
            };
        } catch (e) {
            return {
                favoriteVendors: [],
                isLoading: false,
                error: e,
            };
        }
    },

    getters: {
        isVendorFavorite: (state) => (vendorId) => {
            return state.favoriteVendors.some(vendor => vendor.id === vendorId);
        },

        RefreshFavorites: (state) => {
            return computed(() => state.favoriteVendors);
        },
    },

    actions: {
    async toggleFavorite(vendorId, user, token) {
        try {
            const response = await axios.put(`http://localhost:3000/user/${user}/favorites/${vendorId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            if(response.data === false){
                this.favoriteVendors = this.favoriteVendors.filter(vendor => vendor.id !== vendorId);
                localStorage.setItem('favorites', JSON.stringify(this.favoriteVendors));
            } else {
                const responseVendor = await axios.get(`http://localhost:3000/vendors/${vendorId}`, { headers: { Authorization: `Bearer ${token}` } });
                const vendorData = {
                    id: responseVendor.data.id,
                    shopName: responseVendor.data.shopName,
                }
                this.favoriteVendors.push(vendorData);
                localStorage.setItem('favorites', JSON.stringify(this.favoriteVendors));
            }
            localStorage.setItem('favorites', JSON.stringify(this.favoriteVendors));
            return this.favoriteVendors;           
        } catch (error) {
            throw new Error("Error al actualizar favoritos: " + error.message);
        }
    },

    async fetchFavoriteVendors(user, token) {
        try {            
            const response = await axios.get(`http://localhost:3000/user/${user}/favorites`, { headers: { Authorization: `Bearer ${token}` } });
            this.favoriteVendors = response.data;
            localStorage.setItem('favorites', JSON.stringify(this.favoriteVendors));
            return this.favoriteVendors;
        } catch (error) {
            throw error;
        }
    },
  },

});
