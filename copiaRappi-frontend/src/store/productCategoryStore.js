import { defineStore } from 'pinia';
import axios from 'axios';
import { useUserStore } from './userStore.js';

export const usePCategoryStore = defineStore('productCategory', {
    state: () => ({
        categories: [],
        isLoading: false,
        error: null,
    }),
    actions: {
        async fetchCategories() {
            this.isLoading = true;
            try {
                if(sessionStorage.getItem('productCategories')) {
                    this.categories = JSON.parse(sessionStorage.getItem('productCategories'));
                }
                else {
                    const response = await axios.get('http://localhost:3000/products/category');
                    this.categories = response.data;
                    sessionStorage.setItem('productCategories', JSON.stringify(this.categories));
                }
                return this.categories;
            } catch (error) {
                this.error = error.message || 'Error al obtener las categorías';
            } finally {
                this.isLoading = false;
            }
        },

        async createCategory(categoryData) {
            console.log('Creating category with data:', categoryData);
            const userStore = useUserStore();
            
            if (!categoryData.name) {
                this.error = 'El nombre de la categoría es requerido';
                return;
            }
            try {
                const response = await axios.post('http://localhost:3000/products/category', { name: categoryData.name }, {
                    headers: {
                        Authorization: `Bearer ${userStore.token}`
                    },
                });
                this.categories.push(response.data);
                sessionStorage.setItem('productCategories', JSON.stringify(this.categories));
                return this.categories;
            } catch (error) {
                this.error = error.message || 'Error al crear la categoría';
            }
        },


        async deleteCategory(id) {
            const userStore = useUserStore();
            
            try {
                await axios.delete(`http://localhost:3000/products/category/${id}`, {
                    headers: {
                        Authorization: `Bearer ${userStore.token}`
                    }
                });
                this.categories = this.categories.filter(category => category.id !== id);
                sessionStorage.setItem('productCategories', JSON.stringify(this.categories));
            } catch (error) {
                this.error = error.message || 'Error al eliminar la categoría';
            }
        }

    },
});