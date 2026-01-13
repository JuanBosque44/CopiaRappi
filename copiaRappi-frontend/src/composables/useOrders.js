import { ref } from 'vue';
import axios from 'axios';
import { useUserStore } from '../store';

export function useOrders() {
  const userStore = useUserStore();
  /**
   * Solo las órdenes asociadas a un conductor específico
   */
  const orders = ref([]);
  const loading = ref(false);
  const error = ref(null);
  /**
   * Información adicional sobre las órdenes del conductor
   */
  const info = ref(null);

  const fetchOrdersByDriver = async (driverId) => {
    loading.value = true;
    error.value = null;

    try {
      const { data } = await axios.get(
        `http://localhost:3000/drivers/${driverId}/orders`,
        {
          headers: {
            Authorization: `Bearer ${userStore.token}`,
          },
        }
      );
      info.value = data || null;
      orders.value = data.orders || [];
    } catch (err) {
      error.value = 'Error al cargar órdenes';
    } finally {
      loading.value = false;
    }
  };

  return {
    orders,
    loading,
    error,
    fetchOrdersByDriver,
    info,
  };
}
