<template>
    <div class="admin-categories-view">
        <AdminLayoutView />
            
        <h1>Administrador de categorías</h1>
        <section>
            <div class="categories-list">
                <ul>
                    <p>Categorias de productos</p>
                    <li v-for="category in categories" :key="category.id" class="category">
                        {{ category.name }} 
                        <button class="button" @click="deleteCategory(category.id)">Eliminar</button>
                    </li>
                </ul>
                <button class="button" @click="addCategory">Agregar Categoría</button>
            </div>
        </section>

        <section>
            <div class="categories-list">
                <ul>
                    <p>Categorias de soporte</p>
                    <li v-for="category in supportCategories" :key="category.id" class="category">
                        {{ category }} 
                        <button class="button" @click="deleteSupportCategory(category.id)">Eliminar</button>
                    </li>
                </ul>
                <button class="button" @click="addSupportCategory">Agregar Categoría</button>
            </div>
        </section>
        
    </div>

</template>

<script setup>
import AdminLayoutView from '../../layouts/AdminLayoutView.vue';
import { ref, onMounted } from 'vue';
import { usePCategoryStore } from '../../store/productCategoryStore.js';
import { useSupportStore } from '../../store/supportStore.js';

const categoryStore = usePCategoryStore();
const categories = ref([]);
const supportCategoryStore = useSupportStore();
const supportCategories = ref([]);
const authStore = useAuthStore();

onMounted(async () => {
    try{
        categories.value = await categoryStore.fetchCategories();
        supportCategories.value = await supportCategoryStore.fetchReasons();
    }
    catch(err){
        console.error('Error al cargar categorías:', err);
    }
});

async function deleteCategory(id) {
    console.log('Eliminando categoría con ID:', id);
    await categoryStore.deleteCategory(id);
    categories.value = await categoryStore.fetchCategories();
}

function addCategory() {
    const categoryName = prompt('Ingrese el nombre de la nueva categoría:');
    if (categoryName) {
        categoryStore.createCategory({ name: categoryName }).then(() => {
            categories.value = categoryStore.fetchCategories();
            console.log('Categoría creada:', categoryName);
        }).catch(err => {
            console.error('Error al crear categoría:', err);
        });
    }
}

function addSupportCategory() {
    const categoryName = prompt('Ingrese el nombre de la nueva categoría de soporte:');
    if (categoryName) {
        supportCategoryStore.createReason({ name: categoryName }).then(() => {
            supportCategories.value = supportCategoryStore.fetchReasons();
            console.log('Categoría de soporte creada:', categoryName);
        }).catch(err => {
            console.error('Error al crear categoría de soporte:', err);
        });
    }
}

function deleteSupportCategory(id) {
    console.log('Eliminando categoría de soporte con ID:', id);
    supportCategoryStore.deleteReason(id).then(() => {
        supportCategories.value = supportCategoryStore.fetchReasons();
    }).catch(err => {
        console.error('Error al eliminar categoría de soporte:', err);
    });
}

</script>

<style scoped>
    .admin-categories-view {
        padding: 20px;
        margin-left: 10%;
    }

    .admin-categories-view section {
        display: inline-block;
        vertical-align: top;
        margin-right: 30px;
        width: 45%;
    }

    .button {
        background-color: #ff4d4d;
        color: white;
        border: none;
        padding: 5px 10px;
        cursor: pointer;
    }

    .categories-list {
        margin-top: 20px;
    }

    .category {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        max-width: 100%;
    }

   
</style>