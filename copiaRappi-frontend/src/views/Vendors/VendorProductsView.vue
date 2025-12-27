<template>
    <div class="vendor-container">
        <h2>Productos</h2>
        <VendorLayoutView />
        <!-- PRODUCTOS -->
        <section>
          <h3>Productos</h3>
          <div v-if="loadingProducts">Cargando productos...</div>
          <ul v-else-if="products.length">
            <li v-for="p in products" :key="p.id">
              {{ p.name }} — ${{ Number(p.price).toFixed(2) }}
              <span v-if="p.discount"> (Promo: ${{ Number(p.discount).toFixed(2) }})</span>
              <span class="category-badge">{{ getCategoryName(p.categoryId) }}</span>
              <button @click="toggleProductActive(p.id)">
                {{ p.isActive ? 'Desactivar' : 'Activar' }}
              </button>
              <button @click="editProduct(p)">Editar</button>
              <button @click="deleteProduct(p.id)">Eliminar</button>
            </li>
          </ul>
          <p v-else>No tienes productos cargados.</p>
        </section>
    
        <!-- FORMULARIO PRODUCTO -->
        <section class="add-product">
          <h3>Agregar / Editar Producto</h3>
          <form @submit.prevent="saveProduct">
            <input v-model="productForm.name" placeholder="Nombre del producto" required />
            <textarea v-model="productForm.description" placeholder="Descripción (opcional)"></textarea>
            <input v-model.number="productForm.price" type="number" placeholder="Precio" required min="0" step="0.01" />
            <input v-model.number="productForm.discount" type="number" placeholder="Descuento (opcional)" min="0" step="0.01" />
            <input v-model.number="productForm.stock" type="number" placeholder="Stock" min="1" />
            <select v-model.number="productForm.categoryId" required>
              <option :value="null" disabled>Seleccioná categoría</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
            <input v-model="productForm.imageURL" placeholder="URL de imagen (opcional)" />
            <label>
              <input type="checkbox" v-model="productForm.isActive" /> Activo
            </label>
            <button type="submit">{{ productForm.id ? 'Actualizar' : 'Agregar' }}</button>
          </form>
        </section>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useUserStore } from '../../store';
import axios from 'axios';
import VendorLayoutView from '../../layouts/VendorLayoutView.vue';

const userStore = useUserStore();

/* =====================
   Estado
===================== */

const vendorId = userStore.user.vendorProfileId;

const products = ref([]);
const categories = ref([]);
const loadingProducts = ref(false);

const productForm = reactive({
  id: null,
  name: '',
  description: '',
  price: 0,
  discount: 0,
  stock: 1,
  categoryId: null,
  imageURL: '',
  isActive: true,
});

/* =====================
   Utils
===================== */

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${userStore.token}`,
  },
});

const getCategoryName = (categoryId) => {
  const category = categories.value.find(c => c.id === categoryId);
  return category ? category.name : 'Sin categoría';
};

/* =====================
   API – Categorías
===================== */

const fetchCategories = async () => {
  try {
    const { data } = await axios.get(
      'http://localhost:3000/products/category',
      authHeaders()
    );
    categories.value = data.data || data;
  } catch (err) {
    console.error('Error cargando categorías:', err);
  }
};

/* =====================
   API – Productos
===================== */

const fetchProducts = async () => {
  loadingProducts.value = true;
  try {
    const { data } = await axios.get(
      `http://localhost:3000/vendors/${vendorId}/products`,
      authHeaders()
    );

    products.value = data.map(p => ({
      ...p,
      categoryId: p.category?.id || null,
      price: Number(p.price),
      discount: Number(p.discount || 0),
    }));
  } catch (err) {
    console.error(err);
  } finally {
    loadingProducts.value = false;
  }
};

const saveProduct = async () => {
  if (
    !productForm.name ||
    !productForm.price ||
    productForm.categoryId === null
  ) {
    return alert('Completa todos los campos obligatorios');
  }

  const payload = {
    name: productForm.name.trim(),
    description: productForm.description?.trim() || '',
    price: Number(productForm.price),
    discount: Number(productForm.discount) || 0,
    stock: Number(productForm.stock) || 1,
    categoryId: Number(productForm.categoryId),
    imageURL: productForm.imageURL?.trim() || '',
    isActive: !!productForm.isActive,
    vendorId,
  };

  try {
    if (productForm.id) {
      await axios.patch(
        `http://localhost:3000/products/${productForm.id}`,
        payload,
        authHeaders()
      );
    } else {
      await axios.post(
        'http://localhost:3000/products',
        payload,
        authHeaders()
      );
    }

    resetProductForm();
    await fetchProducts();
    alert('Producto guardado correctamente');
  } catch (err) {
    console.error(err);
    alert('Error al guardar producto');
  }
};

const editProduct = (product) => {
  Object.assign(productForm, product);
};

const toggleProductActive = async (id) => {
  const product = products.value.find(p => p.id === id);
  if (!product) return;

  try {
    await axios.patch(
      `http://localhost:3000/products/${id}`,
      { isActive: !product.isActive },
      authHeaders()
    );
    product.isActive = !product.isActive;
  } catch (err) {
    console.error(err);
  }
};

const deleteProduct = async (id) => {
  try {
    await axios.delete(
      `http://localhost:3000/products/${id}`,
      authHeaders()
    );
    products.value = products.value.filter(p => p.id !== id);
  } catch (err) {
    console.error(err);
  }
};

const resetProductForm = () => {
  Object.assign(productForm, {
    id: null,
    name: '',
    description: '',
    price: 0,
    discount: 0,
    stock: 1,
    categoryId: null,
    imageURL: '',
    isActive: true,
  });
};

/* =====================
   Lifecycle
===================== */

onMounted(async () => {
  await fetchCategories();
  await fetchProducts();
});
</script>


<style scoped>
.vendor-container {
    max-width: 800px; 
    margin: 2rem auto; 
    padding: 1rem; 
    background: #f9f9f9; 
    border-radius: 8px; 
    text-align: center; 
}

section { 
    margin-bottom: 2rem;
}

.products-container {
  max-width: 900px;
  margin: auto;
}

.product-card {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
  background: #fff;
}

.product-actions button {
  margin-right: 0.5rem;
}

ul { list-style: none; padding: 0; }
li { background: #fff; margin: 0.5rem 0; padding: 0.5rem 1rem; border-radius: 4px; border: 1px solid #ddd; }
button { margin-left: 0.5rem; background-color: #42b883; color: white; border: none; padding: 0.3rem 0.6rem; border-radius: 4px; cursor: pointer; }
button:hover { background-color: #369870; }
.add-product form, section form, .support-form { display: flex; flex-direction: column; gap: 0.5rem; align-items: center; }
input, textarea, select { padding: 0.4rem; font-size: 1rem; width: 80%; max-width: 400px; }
.success { color: green; margin-top: 0.5rem; }
.error { color: red; margin-top: 0.5rem; }
.category-badge { background: #e8f5e9; color: #2e7d32; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.85rem; margin-left: 0.5rem; }

</style>