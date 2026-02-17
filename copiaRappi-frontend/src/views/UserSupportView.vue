<script setup>
    import { onMounted, ref } from 'vue';
    import axios from 'axios';

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
        try {
            const enumerableReasons = {
                'ORDER': 'Problemas con mi pedido',
                'PAYMENT': 'Problemas con el pago',
                'OTHER': 'Otros problemas',
                'ACCOUNT': 'Problemas con mi cuenta',
            };
            reasonsMeaning.value = reasonsArray.map(reason => enumerableReasons[reason] || reason);
            reasons.value = reasonsArray;
        }
        catch (err) {
            console.error('Error al transformar las razones de soporte:', err);
            error.value = 'No se pudieron cargar las razones de soporte';
        }
    }

    onMounted(async () => {
        try {
            const res = await axios.get('http://localhost:3000/support/categories');
            await transformReasons(res.data);
        } catch (err) {
            console.error('Error al cargar las razones de soporte:', err);
            error.value = 'No se pudieron cargar las razones de soporte';
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

</style>