import { ref } from 'vue';
import axios from 'axios';
import { useUserStore } from '../store/userStore.js';

export function useOrders() {
  const userStore = useUserStore();
  /**
   * Solo las órdenes asociadas a un conductor específico
   */
  const orders = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const availableOrders = ref([]); 
  /**
   * Información adicional sobre las órdenes del conductor
   */
  const info = ref(null);

  const fetchOrdersByDriver = async (driverId) => {
    loading.value = true;
    error.value = null;

    try {
      /* let { data } = await axios.get(
        `http://localhost:3000/drivers/${driverId}/orders`,
        {
          headers: {
            Authorization: `Bearer ${userStore.token}`,
          },
        }
      ); */
      let data = null;
      if(!data || !data.orders) data = await axios.get(
        `http://localhost:3000/orders?driverId=${driverId}`,
        {
          headers: {
            Authorization: `Bearer ${userStore.token}`,
          },
        }
      );
      console.log('Respuesta de órdenes por conductor:', data);

      //falta buscar entre todas las ordenes y filtrar por driverId
      info.value = data || null;
      orders.value = data.data || [];
    } catch (err) {
      error.value = 'Error al cargar órdenes';
    } finally {
      loading.value = false;
    }
  };

  const fetchAvailableOrders = async (page = 1) => {
    loading.value = true;
    error.value = null;

    try {
      const { data } = await axios.get(
        `http://localhost:3000/orders/available?page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${userStore.token}`,
          },
        }
      );
      availableOrders.value = data || [];
      console.log('Órdenes disponibles:', availableOrders.value);
    } catch (err) {
      error.value = 'Error al cargar órdenes disponibles';
    } finally {
      loading.value = false;
    }
  };

  const acceptOrderApi = async (orderId) => {
    try {
      console.log('Aceptando orden con ID:', orderId);
      await axios.patch(
        `http://localhost:3000/orders/${orderId}`,
        { driverId: userStore.user.driverProfileId, status: 'IN_PROGRESS' },
        {
          headers: {
            Authorization: `Bearer ${userStore.token}`,
          },
        }
      );
      availableOrders.value = availableOrders.value.filter(order => order.id !== orderId);
    } catch (err) {
      error.value = 'Error al aceptar la orden';
    }
  };

  return {
    orders,
    loading,
    error,
    fetchOrdersByDriver,
    info,
    availableOrders,
    fetchAvailableOrders,
    acceptOrderApi,
  };
}
