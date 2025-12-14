<template>
  <div class="admin-container">
    <h1>Panel de Administración</h1>

    <div v-if="users.length">
      <h3>Lista de usuarios:</h3>
      <ul>
        <li v-for="u in users" :key="u.id">
          {{ u.name }} — {{ u.email }} — Rol: {{ u.role }}
          <button class="button" @click="deleteUser(u.id)">Eliminar</button>
        </li>
      </ul>
    </div>
    <div v-else>
      <p>No hay usuarios registrados.</p>
    </div>
    <h4>Mensajes recibidos</h4>
    <div v-if="messages.length !== 0">
      <ul>
        <li v-for="msg in messages" :key="msg.id">
          {{ msg.supportCategory }}
          <br>
          {{ msg.status }}
          <br>
          {{ msg.description }} — De: {{ msg.user.email }}
          <button :disabled="msg.status === 'RESOLVED'" @click="respondMessage">Responder</button>
        </li>
      </ul>
    </div>
    <span v-else class="error-message">
      No hay mensajes recibidos.
    </span>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '../../store';
import axios from 'axios';

const userStore = useUserStore();
const users = ref([]);

const authHeaders = () => ({ headers: { Authorization: `Bearer ${userStore.token}` } });


const fetchUsers = async () => {
  try {
    const { data } = await axios.get(
      'http://localhost:3000/user', authHeaders()
    );
    users.value = data || [];
  } catch (err) {
    console.warn('⚠️ Error fetching users, usando mock');
  }
};

const deleteUser = async (id) => {
  if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

  try {
    await axios.delete(`http://localhost:3000/user/${id}`, authHeaders());
    users.value = users.value.filter(u => u.id !== id);
  } catch (err) {
    console.error('Error al eliminar usuario:', err);
    alert('No se pudo eliminar el usuario.');
  }
};

const messages = ref([]);
const mensajeError = ref('');

const receiveMessages = async () => {
  try {
    const { data } = await axios.get(
      'http://localhost:3000/support/requests?page=1&limit=5', authHeaders()
    );
    messages.value = data.data || [];
    console.log('Mensajes recibidos:', messages.value);
  } catch (err) {
    console.error('Error fetching messages:', err);
    mensajeError.value = 'No se pudieron cargar los mensajes.';
    messages.value = [];
  }
}

const respondMessage = async (id) => {
  try{
    const body = {
      response: 'Tu mensaje ha sido resuelto. Gracias por contactarnos.',
      status: 'RESOLVED'
    };
    const response = await axios.put('http://localhost:3000/support/'+msg.id+'/response', body, authHeaders());
    console.log('Mensaje respondido:', response.data);
    messages.value = messages.value.map(msg => 
      msg.id === id ? { ...msg, status: 'RESOLVED', response: body.response } : msg
    );
  }
  catch(ex){
    console.log('Error al responder el mensaje: ' + ex)
  }
}

onMounted(() => {
  fetchUsers();
  receiveMessages();
});
</script>

<style scoped>
.admin-container {
  max-width: 700px;
  margin: 2rem auto;
  padding: 1rem;
  text-align: center;
  background: #f9f9f9;
  border-radius: 8px;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  background: #fff;
  margin: 0.5rem 0;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.button {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
}

.button:hover {
  background: #c0392b;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #aaa; 
}

/* Agregar los mensajes a la derecha*/ 
</style>


