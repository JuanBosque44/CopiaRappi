<template>
  <div>
    <header>
      <h1>CopiaRappi</h1>
      <nav>
        <router-link to="/register" v-if="!user">Registro</router-link> 
        <router-link to="/" v-if="user && user.role !== 'CLIENT'">Home</router-link>
        <router-link to="/user" v-else>Inicio</router-link>
        <router-link to="/login">Login</router-link>
        <router-link to="/profile" v-if="user">Mi Perfil</router-link>
      </nav>

    </header>

    <main>
      <router-view />
    </main>

<Teleport to="body" v-if="user && user.role === 'CLIENT'">
  <CartFloating />
</Teleport>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useUserStore } from './store/userStore.js';
import CartFloating from './components/CartFloating.vue';

const userStore = useUserStore();

const user = computed(() => userStore.user);

onMounted(async () => {
  if (userStore.token) {
    await userStore.validateSession();
  }
});


</script>

<style scoped>
header {
  display: flex;
  justify-content: space-between;
  padding: 1rem 2rem;
  background-color: #42b883;
  color: white;
}

nav a {
  margin-left: 1rem;
  color: white;
  text-decoration: none;
}

nav a.router-link-active {
  text-decoration: underline;
}
</style>
