<template>
  <div class="admin-container">
    <h1>Panel de Administración</h1>

    <AdminLayoutView />
    <div class="admin-grid">
      <section>
        <div v-if="users.length">
          <h3>Lista de usuarios:</h3>
          <ul>
            <li v-for="u in users" :key="u.id">
              {{ u.name }} — {{ u.email }} — Rol:
              <span v-if="u.role === 'VENDOR'">Vendedor</span>
              <span v-else-if="u.role === 'ADMIN'">Administrador</span>
              <span v-else-if="u.role === 'DRIVER'">Conductor</span>
              <span v-else>Cliente</span>
              <button class="button" @click="deleteUser(u.id)">Eliminar</button>
            </li>
          </ul>
          </div>
          <div v-else>
            <p>No hay usuarios registrados.</p>
          </div>
      </section>
      <section>
        
        <h4>Mensajes recibidos:</h4>
        <div v-if="messages.length !== 0">
          <ul>
            <li v-for="msg in messages" :key="msg.id" class="message-row">
              <div class="message-row-content">
                <div class="message-field"><strong>Categoría:</strong> {{ transformCategory(msg.supportCategory) || msg.supportCategory }}</div>
                <div class="message-field"><strong>Estado:</strong> {{ msg.status }}</div>
                <div class="message-field"><strong>Descripción:</strong> {{ msg.description }}</div>
                <div class="message-field"><strong>Usuario:</strong> {{ emails[messages.indexOf(msg)] || 'Desconocido' }}</div>
              </div>
              <button class="button" :disabled="msg.status === 'RESOLVED'" @click="respondMessage(msg)">Responder</button>
            </li>
          </ul>
        </div>
        <span v-else class="error-message">
          No hay mensajes recibidos.
          <br>
        </span>
        <button class="btn-paginas" :disabled="page <= 1" @click="receiveMessages(-1)" >Anterior</button>
        <button class="btn-paginas" :disabled="page >= totalPages" @click="receiveMessages(1)">Siguiente</button>
      </section>
    </div>
  </div>  
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useUserStore } from '../../store/userStore.js';
import axios from 'axios';
import AdminLayoutView from '/src/layouts/AdminLayoutView.vue';
import { TransformReasons } from '../../composables/useReason.js';
import { useAuthError } from '../../composables/useAuthError.js';

const userStore = useUserStore();
const { captureError } = useAuthError();
const users = ref([]);
let page = ref(1);
let totalPages = ref(1);

const authHeaders = () => ({ headers: { Authorization: `Bearer ${userStore.token}` } });


const fetchUsers = async () => {
  try {
    const { data } = await axios.get(
      'http://localhost:3000/user', authHeaders()
    );
    users.value = data || [];
    users.value.sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.warn('⚠️ Error al buscar usuarios:' + err);
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
const emails = ref([]);
const receiveMessages = async (incremento) => {
  try {
    page.value += incremento;
    const { data } = await axios.get(
      'http://localhost:3000/support/requests?page='+page.value+'&limit=5', authHeaders()
    );
    messages.value = data.data || [];
    totalPages.value = data.meta.pages || 0;
    if (page.value > totalPages.value) {
      page.value = totalPages.value;
    }
    if (page.value < 1 || isNaN(page.value)) {
      page.value = 1;
    }
    console.log('Mensajes recibidos');

    for (var i = 0; i < messages.value.length; i++) {
      const user = await axios.get('http://localhost:3000/user/'+messages.value[i].userId, authHeaders());
      emails.value[i] = user.data.email;
    }
  } catch (err) {
    console.error('Error al recibir los mensajes: ', err);
    mensajeError.value = 'No se pudieron cargar los mensajes.';
    messages.value = [];
  }
}

const respondMessage = async (msg) => {
  try{
    if(msg.status === 'RESOLVED'){
      alert('El mensaje ya ha sido resuelto.');
      return;
    }
    const body = {
      response: 'Tu mensaje ha sido resuelto. Gracias por contactarnos.',
      status: 'RESOLVED',
      UserId: msg.userId
    };
    const response = await axios.put('http://localhost:3000/support/'+msg.id+'/response', body, authHeaders());
    console.log('Mensaje respondido:', response.data);
    messages.value = messages.value.map(msg => 
      msg.id === msg.id ? { ...msg, status: 'RESOLVED', response: body.response } : msg
    );
  }
  catch(ex){
    console.log('Error al responder el mensaje: ' + ex)
  }
}

const transformCategory = computed(() => {
  return (supportCategory) => {
    const reasons = TransformReasons([supportCategory], mensajeError);
    return reasons[0];
  };
});

onMounted(() => {
  try {
    fetchUsers();
    receiveMessages(0);
  }
  catch (err) {
    console.warn('⚠️ Error al cargar datos:' + err);
    captureError(err);
  }
});
</script>

<style scoped>
.admin-container {
  max-width: 1200px;
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
  border-radius: 4px;
  cursor: pointer;
  margin-left: 1%;
  padding: auto;
}

.btn-paginas {
  margin: 10px;
  padding: 8px 16px;
  font-size: 14px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.admin-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  align-items: start;
}

.message-row {
  background: #fff;
  margin: 0.5rem 0;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.message-row-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.35rem;
  align-items: start;
  margin-bottom: 0.4rem;
}

.message-field {
  padding: 6px 8px;
  background: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #e1e1e1;
  word-break: break-word;
}

.message-field strong {
  display: inline-block;
  width: 95px;
  font-weight: 700;
}

.button:hover {
  background: #c0392b;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #aaa; 
}

span{
  color: green;
}

</style>


