<template>
    <div class="role-form" >
        <h3>Datos del conductor y vehículo</h3>
        
        <input v-model="phone" type="tel" placeholder="Teléfono (Ej: +569...)" required />

        <select v-model="vehicleType" required>
            <option disabled value="">Tipo de Vehículo</option>
            <option value="MOTO">Moto</option>
            <option value="BICI">Bicicleta</option>
            <option value="AUTO">Auto</option>
        </select>
        <input v-model="licensePlate" type="text" placeholder="Patente / Matrícula" required />
        <input v-model="vehicleBrand" type="text" placeholder="Marca del Vehículo (Ej: Yamaha)" />
        <input v-model="vehicleModel" type="text" placeholder="Modelo del Vehículo (Ej: FZ 25)" />
        
        <input v-model="driverLicense" type="text" placeholder="Número de Licencia de Conducir" required />
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    phone: { type: String, default: '' },
    vehicleType: { type: String, default: '' },
    licensePlate: { type: String, default: '' },
    vehicleBrand: { type: String, default: '' },
    vehicleModel: { type: String, default: '' },
    driverLicense: { type: String, default: '' }
});

const emit = defineEmits([
    'update:phone',
    'update:vehicleType',
    'update:licensePlate',
    'update:vehicleBrand',
    'update:vehicleModel',
    'update:driverLicense'
]);

const phone = computed({
    get: () => props.phone,
    set: (val) => emit('update:phone', val)
});

const vehicleType = computed({
    get: () => props.vehicleType,
    set: (val) => emit('update:vehicleType', val)
});

const licensePlate = computed({
    get: () => props.licensePlate,
    set: (val) => emit('update:licensePlate', val)
});

const vehicleBrand = computed({
    get: () => props.vehicleBrand,
    set: (val) => emit('update:vehicleBrand', val)
});

const vehicleModel = computed({
    get: () => props.vehicleModel,
    set: (val) => emit('update:vehicleModel', val)
});

const driverLicense = computed({
    get: () => props.driverLicense,
    set: (val) => emit('update:driverLicense', val)
});

</script>

<style scoped>
.role-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 20px;
}

.role-form input,
.role-form select {
    padding: 8px;
    font-size: 16px;
    border: 1px solid #ccc;
    border-radius: 4px;
}
</style>