<template>
  <div class="admin-container">
    <h1>Panel de Administración</h1>
    <div class="admin-grid">
      <section>
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
      </section>
      <section>
        
        <h4>Mensajes recibidos:</h4>
        <div v-if="messages.length !== 0">
          <ul>
            <li v-for="msg in messages" :key="msg.id">
              {{ msg.supportCategory }}
              <br>
              {{ msg.status }}
              <br>
              {{ msg.description }} — De: {{ emails }}
              <button :disabled="msg.status === 'RESOLVED'" @click="respondMessage(msg)">Responder</button>
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
import { ref, onMounted } from 'vue';
import { useUserStore } from '../../store';
import axios from 'axios';

const userStore = useUserStore();
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
      emails.value = user.data.email;
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

onMounted(() => {
  fetchUsers();
  receiveMessages(0);
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
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 1%;
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


.button:hover {
  background: #c0392b;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #aaa; 
}

</style>


