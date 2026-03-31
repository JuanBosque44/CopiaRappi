import { ref, watch } from 'vue';
import { useUserStore } from '../store/userStore.js';
import { useRouter } from 'vue-router';

export function useAuthError() {
  const userStore = useUserStore();
  const router = useRouter();
  const error = ref(0);

  watch(error, (newValue) => {
    if (newValue === 401) {
      handleUnauthorized();
    }
  });

  const handleUnauthorized = () => {
    alert('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.');
    userStore.logout();
    router.replace('/login');
  };

  const captureError = (err) => {
    error.value = err.response?.status || 0;
  };

  return {
    error,
    captureError,
    handleUnauthorized
  };
}
