<script setup>
    import { onMounted, ref } from 'vue';
    import axios from 'axios';
    import { useSupportStore } from '../store/supportStore.js';
    import { useUserStore } from '../store/userStore.js';
    import VendorLayoutView from '../layouts/VendorLayoutView.vue';
    import DriverLayoutView from '../layouts/DriverLayoutView.vue';
    import { TransformReasons } from '../composables/useReason.js';
    import { useAuthError } from '../composables/useAuthError.js';

    const supportStore = useSupportStore();
    const userStore = useUserStore();
    const { captureError } = useAuthError();

    const user = ref(userStore.user);
    const message = ref('');
    const error = ref('');
    const selectedReason = ref('');
    let reasons = ref([]);
    let reasonsMeaning = ref([])

    const submitForm = async () => {
        try {
            if (!validateMessage()) return;
            error.value = '';
            await axios.post('http://localhost:3000/support/contact', { supportCategory: selectedReason.value, description: message.value.trim() }, {
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            alert(`¡Comentario enviado!`);
            message.value = '';
        } catch (err) {
            console.error('Error al enviar el formulario de soporte:', err);
            error.value = 'No se pudo enviar el formulario. Inténtalo de nuevo más tarde.';
        }
    };

    const transformReasons = async (reasonsArray) => {
        reasons.value = reasonsArray.map(r => r.id);
        reasonsMeaning.value = TransformReasons(reasonsArray, error);
        console.log('Razones transformadas:', reasonsMeaning.value);
    }

    onMounted(async () => {
        try {
            const res = await supportStore.fetchReasons() || [];
            await transformReasons(res);
        } catch (err) {
            console.error('Error al cargar las razones de soporte:', err);
            error.value = 'No se pudieron cargar las razones de soporte';
            captureError(err);
        }
    });

    const validateMessage = () => {
        if (message.value.trim() === '') {
            error.value = 'El comentario no puede estar vacío.';
        } else {
            error.value = '';
        }
    };
</script>

<template>
    <div class="support-container container">
        <h1>Soporte</h1>
        <div class="container">
            <div class="navs">
                <VendorLayoutView v-if="user.role === 'VENDOR'" />
                <DriverLayoutView v-if="user.role === 'DRIVER'" />
            </div>
            <h3>¿Necesitas ayuda? ¿Detectaste algun error? Contáctanos:</h3>
            <form @submit.prevent="submitForm">
                <div class="form-section">
                    <label for="">Razón</label>
                    <select v-model="selectedReason" required>
                        <option disabled value="">Seleccione una opción</option>
                        <option v-for="(reason, index) in reasons" :key="reasonsMeaning[index]" :value="reason">{{ reasonsMeaning[index] }}</option>
                    </select>
                    <p v-if="error" class="error">{{ error }}</p>
                </div>
                <div class="form-section">
                    <label for="">Comentario: </label>
                    <input type="text" v-model="message" placeholder="Escribe tu comentario aquí" required @change="validateMessage" />
                </div>
                <button type="submit" :disabled="error.length > 0">Enviar</button>
                <RouterLink to="/profile">Volver al perfil</RouterLink>
            </form>
        </div>
    </div>
</template>

<style scoped>
.support-container {
    padding: 20px;
}

.container {
    margin-top: 20px;
}

form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 10px;
}

input {
    padding: 8px;
    font-size: 16px;
    border: 1px solid #ccc;
    border-radius: 4px;
    width: 300px;
}

button {
    padding: 10px;
    background-color: #42b883;
    max-width: 10%;
}

button:hover {
    background-color: #369870;
}

button:disabled {
    background-color: #a5d6c7;
    cursor: not-allowed;
}

.form-section {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

select {
    padding: 8px;
    font-size: 16px;
    border: 1px solid #ccc;
    border-radius: 4px;
    width: 315px;
}

.navs {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
}

</style>