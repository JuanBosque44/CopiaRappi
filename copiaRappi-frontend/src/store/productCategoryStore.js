import { defineStore } from 'pinia';
import axios from 'axios';

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
                this.error = error.message || 'Error fetching product categories';
            } finally {
                this.isLoading = false;
            }
        },
    },
});