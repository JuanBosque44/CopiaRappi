import { defineStore } from 'pinia';
import axios from 'axios';

export const usePaymentStore = defineStore('payment', {
  state: () => ({
    payments: [],
    currentPayment: null,
    isLoading: false,
    error: null,
    methods: []
  }),

  getters: {
    paymentsByUser: (state) => (userId) => {
      return state.payments.filter(p => p.userId === userId);
    },
    
    pendingPayments: (state) => {
      return state.payments.filter(p => p.status === 'PENDING');
    },

    completedPayments: (state) => {
      return state.payments.filter(p => p.status === 'COMPLETED');
    },
  },

  actions: {
    async createPayment(paymentData, token) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await axios.post(
          'http://localhost:3000/payments',
          paymentData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        this.payments.push(response.data);
        this.currentPayment = response.data;
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al crear el pago';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchPayments(token) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await axios.get(
          'http://localhost:3000/payments',
          { headers: { Authorization: `Bearer ${token}` } }
        );
        this.payments = response.data;
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al obtener pagos';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchPaymentById(id, token) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await axios.get(
          `http://localhost:3000/payments/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        this.currentPayment = response.data;
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al obtener el pago';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchPaymentsMethods() {
        this.isLoading = true;
        this.error = true;
        try {
            const response = await axios.get(`http://localhost:3000/payments-methods`)
            this.methods = response.data
            return response.data
        } catch (error) {
            this.error = error.response?.data?.message || 'Error al cargar los métodos de pago';
            throw error;
        } finally {
            this.isLoading = false;
        }
    },

    async updatePayment(id, updateData, token) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await axios.patch(
          `http://localhost:3000/payments/${id}`,
          updateData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const index = this.payments.findIndex(p => p.id === id);
        if (index !== -1) {
          this.payments[index] = response.data;
        }
        if (this.currentPayment?.id === id) {
          this.currentPayment = response.data;
        }
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al actualizar el pago';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async deletePayment(id, token) {
      this.isLoading = true;
      this.error = null;
      try {
        await axios.delete(
          `http://localhost:3000/payments/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        this.payments = this.payments.filter(p => p.id !== id);
        if (this.currentPayment?.id === id) {
          this.currentPayment = null;
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al eliminar el pago';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async confirmPayment(id, success, token) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await axios.patch(
          `http://localhost:3000/payments/${id}/confirm`,
          { success },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const index = this.payments.findIndex(p => p.id === id);
        if (index !== -1) {
          this.payments[index] = response.data;
        }
        if (this.currentPayment?.id === id) {
          this.currentPayment = response.data;
        }
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al confirmar el pago';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    clearCurrentPayment() {
      this.currentPayment = null;
    },

    clearError() {
      this.error = null;
    },
  },
});
