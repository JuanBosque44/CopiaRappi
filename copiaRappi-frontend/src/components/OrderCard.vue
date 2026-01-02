<script setup>
    defineProps({
       orders: {
           type: Object,
           required: true
       },
       fecha: {
           type: String,
           required: false
       },
    });
</script>

<template>
    <ul v-if="orders.orders && orders.orders.length" class="container">
        <li v-for="order in orders.orders" :key="order.id" class="card">
            Orden #{{ order.id }} - Monto: ${{ order.totalAmount }} <span v-if="fecha">- Fecha: {{ fecha }}</span> <span v-if="order.status"> - Estado: {{ order.status }}</span>
            <span class="products" v-if="order.items && order.items.length">
                <h4>Productos:</h4>
                <ul>
                    <li v-for="item in order.items" :key="item.id">
                        {{ item.name }} x{{ item.quantity }}
                    </li>
                </ul>
            </span>
        </li>
    </ul>
</template>

<style scoped> 
.container {
    list-style-type: none;
    padding: 0;
    margin: 0;
}
.card {
    background-color: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.products {
    margin-top: 0.5rem;
}
</style>