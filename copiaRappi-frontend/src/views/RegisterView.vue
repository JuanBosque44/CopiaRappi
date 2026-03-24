<template>
  <div class="register-container">
    <h1>Registro</h1>
    <form @submit.prevent="handleRegister">
      <input v-model="name" type="text" placeholder="Nombre" required />
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Contraseña" required />
      
      <select v-model="role" required>
        <option disabled value="">Selecciona un rol</option>
        <option value="CLIENT">Cliente</option>
        <option value="DRIVER">Conductor</option>
        <option value="VENDOR">Vendedor</option>
      </select>

      <div v-if="role === 'DRIVER'">
        <DriverForm v-model:phone="phone" 
                    v-model:vehicleType="vehicleType" 
                    v-model:licensePlate="licensePlate" 
                    v-model:vehicleBrand="vehicleBrand" 
                    v-model:vehicleModel="vehicleModel" 
                    v-model:driverLicense="driverLicense" 
                    v-on:validate-driver-form="handleDriverFormValidation"  />
      </div>

      <div v-else-if="role === 'VENDOR'" class="role-form">
        <h3>Datos del Vendedor</h3>
        <input v-model="storeName" type="text" placeholder="Nombre de la Tienda" required />
        <input v-model="storeAddress" type="text" placeholder="Dirección Principal" required />
      </div>

      <button type="submit">Registrarse</button>
    </form>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import DriverForm from '../components/DriverForm.vue';

const name = ref('');
const email = ref('');
const password = ref('');
const role = ref('');
const errorMessage = ref('');

// Campos Específicos de DRIVER
const phone = ref('');
const vehicleType = ref(''); 
const licensePlate = ref('');
const vehicleBrand = ref('');
const vehicleModel = ref('');
const driverLicense = ref('');

// Campos Específicos de VENDOR
const storeName = ref('');
const storeAddress = ref('');

const router = useRouter();

// Función de validación numérica (permite + al inicio)
const isPhoneNumberValid = (number) => {
  const phoneRegex = /^\+?\d+$/;
  return phoneRegex.test(number);
};

const handleDriverFormValidation = (isValid) => {
  if (!isValid) {
    errorMessage.value = 'Debes completar todos los datos del conductor y vehículo correctamente.';
    console.warn('Validación del formulario de conductor fallida:', { phone: phone.value, vehicleType: vehicleType.value, licensePlate: licensePlate.value, vehicleBrand: vehicleBrand.value, vehicleModel: vehicleModel.value, driverLicense: driverLicense.value });
  } else {
    errorMessage.value = '';
    phone.value = isValid.phone;
    vehicleType.value = isValid.vehicleType;
    licensePlate.value = isValid.licensePlate;
    vehicleBrand.value = isValid.vehicleBrand;
    vehicleModel.value = isValid.vehicleModel;
    driverLicense.value = isValid.driverLicense;
    console.log('Validación del formulario de conductor exitosa:', { phone: phone.value, vehicleType: vehicleType.value, licensePlate: licensePlate.value, vehicleBrand: vehicleBrand.value, vehicleModel: vehicleModel.value, driverLicense: driverLicense.value });
  }
};

const validateFields = () => {
  errorMessage.value = ''; 
  

  
  if (!name.value || !email.value || !password.value || !role.value) {
    errorMessage.value = 'Debes completar el nombre, email, contraseña y seleccionar un rol.';
    return false;
  }

  if (role.value === 'DRIVER') {
    if (phone.value && !isPhoneNumberValid(phone.value)) {
      errorMessage.value = 'El campo Teléfono solo puede contener números y opcionalmente el signo "+".';
      return false;
    }

    if (handleDriverFormValidation === false) {
      errorMessage.value = 'Debes completar todos los datos personales, del vehículo y la licencia.';
      console.log(phone.value + ' ' + vehicleType.value + ' ' + licensePlate.value + ' ' + vehicleModel.value + ' ' + driverLicense.value);
      return false;
    }
  } else if (role.value === 'VENDOR') {
    if (!storeName.value || !storeAddress.value) {
      errorMessage.value = 'Como restaurante, debes completar el nombre y la dirección de la tienda.';
      return false;
    }
  }

  if(role.value === 'ADMIN'){
    errorMessage.value = 'No puedes registrarte como administrador sin permiso.'
    return false
  }
  
  return true;
};


const handleRegister = async () => {
  if (!validateFields()) {
    console.warn('Registro detenido: Faltan campos obligatorios o son inválidos.');
    return;
  }
  
  const userData = {
    name: name.value,
    email: email.value,
    password: password.value,
    role: role.value,
  };

  if (role.value === 'DRIVER') {
    Object.assign(userData, {
      driverProfile: {
        DriverDto: { 
          phone: phone.value,
          driverLicense: driverLicense.value,
          vehicleType: vehicleType.value,
          licensePlate: licensePlate.value,
          vehicleBrand: vehicleBrand.value,
          vehicleModel: vehicleModel.value,
        },
      },
    });
  } else if (role.value === 'VENDOR') {
    Object.assign(userData, {
      vendorProfile: {
        VendorDto: { 
          shopName: storeName.value, 
        },
      },
    });
  }

  console.log('Datos de registro a enviar:', userData);

  try {
    await axios.post('http://localhost:3000/auth/register', userData);
    router.replace('/login');
  } catch (err) {
    console.error('Error al registrar:', err.response?.data || err);
    errorMessage.value = err.response?.data?.message || 'No se pudo registrar. Verifica los datos.';
  }
};
</script>

<style scoped>
.register-container {
  max-width: 400px;
  margin: 2rem auto;
  text-align: center;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem; 
  border-radius: 10px; 
  border: 1px solid #ddd;
}

input, select {
  padding: 0.75rem; 
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 6px; 
  transition: border-color 0.3s;
}

input:focus, select:focus {
    border-color: #42b883; 
    outline: none;
}

.role-form {
  border: 1px dashed #42b883;
  padding: 1rem;
  margin-top: 0.5rem;
  border-radius: 8px; 
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: #42b883;
}

button {
  padding: 0.75rem; 
  font-size: 1.1rem; 
  background-color: #42b883;
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 8px; 
  transition: background-color 0.3s, transform 0.1s;
}

button:hover {
  background-color: #369870;
}

button:active {
    transform: scale(0.99);
}

.error {
  color: #e53e3e;
  margin-top: 1rem;
  font-weight: bold;
}
</style>