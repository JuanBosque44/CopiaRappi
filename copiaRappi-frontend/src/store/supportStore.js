import { defineStore } from 'pinia';
import axios from 'axios';

export const useSupportStore = defineStore('support', {
    state: () => ({
        reasons: [],
        isLoading: false,
        error: null,
    }),
    actions: {
        async fetchReasons() {
            this.isLoading = true;
            try {
                if(localStorage.getItem('supportReasons')) {
                    this.reasons = JSON.parse(localStorage.getItem('supportReasons'));
                }
                else {
                    const response = await axios.get('http://localhost:3000/support/categories');
                    this.reasons = response.data;
                    localStorage.setItem('supportReasons', JSON.stringify(this.reasons));
                }
                return this.reasons;
            } catch (error) {
                this.error = error.message || 'Error al obtener las razones de soporte';
            } finally {
                this.isLoading = false;
            }
        },
    },
});