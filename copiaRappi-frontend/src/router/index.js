import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import AdminView from '../views/Admins/AdminView.vue';
import UserView from '../views/Clients/UserView.vue';
import DriverView from '../views/Drivers/DriverView.vue';
import VendorView from '../views/Vendors/VendorView.vue';
import UserProfileView from '../views/UserProfileView.vue';
import OrderConfirmationView from '../views/Clients/OrderConfirmationView.vue';
import PaymentConfirmationView from '../views/Clients/PaymentConfirmationView.vue';
import PaymentsView from '../views/PaymentsView.vue';
import { useUserStore } from '../store/userStore.js';

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/login', name: 'login', component: LoginView },
  { path: '/register', name: 'register', component: RegisterView },

  // Rutas de admin
  {
    path: '/admin',
    name: 'admin',
    component: AdminView,
    meta: { requiresAuth: true, roles: ['ADMIN'] },
  },

  //Rutas de user
  {
    path: '/user',
    name: 'user',
    component: UserView,
    meta: { requiresAuth: true, roles: ['CLIENT', 'ADMIN'] },
  },
  {
    path: '/user/orders',
    name: 'user-orders',
    component: () => import('../views/Clients/UserOrdersView.vue'),
    meta: { requiresAuth: true, roles: ['CLIENT', 'VENDOR', 'DRIVER'] },
  },
  {
    path: '/user/support',
    name: 'user-support',
    component: () => import('../views/UserSupportView.vue'),
  },
  {
    path: '/cart',
    name: 'cart',
    component: () => import('../views/Clients/CartView.vue'),
    meta: { requiresAuth: true, roles: ['CLIENT', 'ADMIN'] },
  },
  {
    path: '/order-confirmation/:orderId?',
    name: 'order-confirmation',
    component: OrderConfirmationView,
    meta: { requiresAuth: true, roles: ['CLIENT', 'ADMIN'] },
  },
  {
    path: '/payment-confirmation/:orderId/:status',
    name: 'payment-confirmation',
    component: PaymentConfirmationView,
    meta: { requiresAuth: true, roles: ['CLIENT', 'ADMIN'] },
  },
  {
    path: '/payments',
    name: 'payments',
    component: PaymentsView,
    meta: { requiresAuth: true, roles: ['CLIENT', 'ADMIN'] },
  },
  //Rutas de vendor
  {
    path: '/vendors/:vendorId',
    name: 'vendor-products',
    component: () => import('../views/VendorDetails.vue'),
    meta: { requiresAuth: true, roles: ['CLIENT', 'VENDOR', 'DRIVER'] },
  },
  {
    path: '/vendor',
    name: 'vendor',
    component: VendorView,
    meta: { requiresAuth: true, roles: ['VENDOR'] },
  },
  {
    path: '/vendor/products',
    name: 'vendor-products-management',
    component: () => import('../views/Vendors/VendorProductsView.vue'),
    meta: { requiresAuth: true, roles: ['VENDOR'] },
  },
  {
    path: '/vendor/orders',
    name: 'vendor-orders',
    component: () => import('../views/Vendors/VendorOrdersView.vue'),
    meta: { requiresAuth: true, roles: ['VENDOR'] },
  },
  {
    path: '/vendor/reports',
    name: 'vendor-stats',
    component: () => import('../views/Vendors/VendorReportView.vue'),
    meta: { requiresAuth: true, roles: ['VENDOR'] },
  },
  //Rutas de driver
  {
    path: '/driver',
    name: 'driver',
    component: DriverView,
    meta: { requiresAuth: true, roles: ['DRIVER'] },
  },
  {
    path: '/driver/revenue',
    name: 'driver-revenue',
    component: () => import('../views/Drivers/DriverRevenueView.vue'),
    meta: { requiresAuth: true, roles: ['DRIVER'] },
  },
  {
    path: '/profile',
    name: 'profile',
    component: UserProfileView,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Guard global de rutas
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  const user = userStore.user;

  if (to.meta.requiresAuth && !user) return next('/login');
  if (to.meta.roles && user && !to.meta.roles.includes(user.role)) return next('/');
  
  next();
});

export default router;
