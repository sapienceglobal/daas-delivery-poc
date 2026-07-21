  /**
 * Centralized API client for the Restaurant Commerce Platform.
 * All API calls go through this module for consistent error handling,
 * token management, and base URL resolution.
 */

const getApiBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // If the frontend was built with localhost (or defaulted to it), but is being accessed from a remote IP (like a VPS),
    // If the frontend was built with localhost (or defaulted to it), but is being accessed from a remote IP (like a VPS),
    // we MUST override the API URL to point to the same remote host on port 5001 to prevent CORS and Private Network Access errors.
    if ((!envUrl || envUrl.includes('localhost')) && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${window.location.protocol}//${hostname}:5001`;
    }
  }
  
  if (envUrl) {
    return envUrl;
  }

  return 'http://localhost:5001';
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Core fetch wrapper with built-in auth, error handling, and JSON parsing.
 */
const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    'x-app-secret': process.env.NEXT_PUBLIC_APP_SECRET || 'DAAS_MOBILE_SECRET_2026',
    'x-tenant-id': process.env.NEXT_PUBLIC_SINGLE_RESTAURANT_MODE === 'true' ? 'lassi-lounge' : 'marketplace',
    ...options.headers,
  };

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // M2 fallback: If httpOnly cookie fails cross-port, use token from localStorage
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('marketplace_token');
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    credentials: 'include', // send cookies
    ...options,
    headers,
  };

  // Stringify body if it's an object (not FormData)
  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);

  // Handle non-JSON responses
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return response;
  }

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

// ── Convenience methods ─────────────────────────────────────────────────────

export const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body }),
  patch: (endpoint, body) => request(endpoint, { method: 'PATCH', body }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
  upload: (endpoint, formData) => request(endpoint, { method: 'POST', body: formData }),
};

// ── Auth API ────────────────────────────────────────────────────────────────

export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  googleLogin: (data) => api.post('/api/auth/google', data),
  logout: () => api.post('/api/auth/logout'),
  getMe: () => api.get('/api/auth/me'),
  updateProfile: (data) => api.put('/api/auth/me', data),
  changePassword: (data) => api.put('/api/auth/me/password', data),
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/api/auth/reset-password/${token}`, { password }),
  
  // Addresses
  addAddress: (data) => api.post('/api/auth/me/addresses', data),
  editAddress: (id, data) => api.put(`/api/auth/me/addresses/${id}`, data),
  removeAddress: (id) => api.delete(`/api/auth/me/addresses/${id}`),
  setDefaultAddress: (id) => api.patch(`/api/auth/me/addresses/${id}/default`),

  // Cards
  addCard: (data) => api.post('/api/auth/me/cards', data),
  removeCard: (id) => api.delete(`/api/auth/me/cards/${id}`),
  setDefaultCard: (id) => api.patch(`/api/auth/me/cards/${id}/default`),

  // Cart
  getCart: () => api.get('/api/auth/me/cart'),
  updateCart: (data) => api.put('/api/auth/me/cart', data),
  clearCart: () => api.delete('/api/auth/me/cart'),
  toggleFavoriteRestaurant: (id) => api.post(`/api/auth/me/favorites/restaurants/${id}`),
  toggleFavoriteItem: (id) => api.post(`/api/auth/me/favorites/items/${id}`),
};

// ── Restaurant API ──────────────────────────────────────────────────────────

export const restaurantAPI = {
  getAll: (params = '') => api.get(`/api/restaurants${params ? '?' + params : ''}`),
  getById: (id) => api.get(`/api/restaurants/${id}`),
  getNearby: (lat, lng, maxDistance) => api.get(`/api/restaurants/nearby?lat=${lat}&lng=${lng}&maxDistance=${maxDistance || 15}`),
  search: (q) => api.get(`/api/restaurants/search?q=${encodeURIComponent(q)}`),
  getCuisines: () => api.get('/api/restaurants/cuisines'),
  create: (data) => api.post('/api/restaurants', data),
  update: (id, data) => api.put(`/api/restaurants/${id}`, data),
  updateBanner: (id, data) => api.put(`/api/restaurants/${id}/banner`, data),
  updateHours: (id, data) => api.put(`/api/restaurants/${id}/hours`, data),
  toggleActive: (id) => api.put(`/api/restaurants/${id}/toggle`),
  getFinance: (id, days = 30) => api.get(`/api/restaurants/${id}/finance?days=${days}`),
  submitOnboarding: (id, data) => api.put(`/api/restaurants/${id}/onboarding`, data),
  reviewOnboarding: (id, data) => api.put(`/api/restaurants/${id}/onboarding/review`, data),
  reviewDocument: (id, documentId, data) => api.put(`/api/restaurants/${id}/documents/${documentId}/review`, data),
  updateStatus: (id, status) => api.put(`/api/restaurants/${id}/status`, { status }),
  updateCommission: (id, rate) => api.put(`/api/restaurants/${id}/commission`, { commissionRate: rate }),
};

// ── Menu API ────────────────────────────────────────────────────────────────

export const menuAPI = {
  getByRestaurant: (restaurantId) => api.get(`/api/menu/restaurant/${restaurantId}`),
  getItem: (id) => api.get(`/api/menu/items/${id}`),
  getCategories: (restaurantId) => api.get(`/api/menu/categories/${restaurantId}`),
  createCategory: (data) => api.post('/api/menu/categories', data),
  updateCategory: (id, data) => api.put(`/api/menu/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/api/menu/categories/${id}`),
  createItem: (data) => api.post('/api/menu/items', data),
  updateItem: (id, data) => api.put(`/api/menu/items/${id}`, data),
  deleteItem: (id) => api.delete(`/api/menu/items/${id}`),
  toggleItem: (id) => api.patch(`/api/menu/items/${id}/toggle`),
  bulkImport: (data) => api.post('/api/menu/bulk-import', data),
};

// ── Order API ───────────────────────────────────────────────────────────────

export const orderAPI = {
  create: (data) => api.post('/api/orders', data),
  getMyOrders: (params = '') => api.get(`/api/orders/my-orders${params ? '?' + params : ''}`),
  getById: (id) => api.get(`/api/orders/${id}`),
  cancel: (id) => api.post(`/api/orders/${id}/cancel`),
  rate: (id, data) => api.post(`/api/orders/${id}/rate`, data),
  getDeliveryQuote: (data) => api.post('/api/orders/delivery-quote', data),
  // Merchant
  getRestaurantOrders: (restaurantId, params = '') => api.get(`/api/orders/restaurant/${restaurantId}${params ? '?' + params : ''}`),
  updateStatus: (id, status) => api.put(`/api/orders/${id}/status`, { status }),
  accept: (id) => api.put(`/api/orders/${id}/accept`),
  reject: (id, reason) => api.put(`/api/orders/${id}/reject`, { reason }),
  // Admin
  getAll: (params = '') => api.get(`/api/orders${params ? '?' + params : ''}`),
  refund: (id, data) => api.post(`/api/orders/${id}/refund`, data),
  // Dev
  simulate: (id) => api.post(`/api/orders/${id}/simulate`),
  // Reviews
  replyToReview: (id, reply) => api.post(`/api/orders/${id}/reply`, { reply }),
};

// ── Review API ──────────────────────────────────────────────────────────────

export const reviewAPI = {
  getByRestaurant: (restaurantId, params = '') => api.get(`/api/reviews/restaurant/${restaurantId}${params ? '?' + params : ''}`),
  getItemReviews: (itemId) => api.get(`/api/reviews/item/${itemId}`),
  create: (data) => api.post('/api/reviews', data),
  reply: (id, text) => api.post(`/api/reviews/${id}/reply`, { text }),
  markHelpful: (id) => api.post(`/api/reviews/${id}/helpful`),
};

// ── Coupon API ──────────────────────────────────────────────────────────────

export const couponAPI = {
  validate: (code, cartValue, restaurantId) => api.post('/api/coupons/validate', { code, cartValue, restaurantId }),
  getAll: (params = '') => api.get(`/api/coupons${params ? '?' + params : ''}`),
  create: (data) => api.post('/api/coupons', data),
  update: (id, data) => api.put(`/api/coupons/${id}`, data),
  delete: (id) => api.delete(`/api/coupons/${id}`),
};

// ── Upload API ──────────────────────────────────────────────────────────────

export const uploadAPI = {
  uploadFile: (file, folder) => {
    const formData = new FormData();
    formData.append('image', file);
    if (folder) formData.append('folder', folder);
    return api.upload('/api/upload', formData);
  },
  uploadBase64: (image, folder) => api.post('/api/upload/base64', { image, folder }),
};

// ── Admin API ───────────────────────────────────────────────────────────────

export const adminAPI = {
  getDashboard: () => api.get('/api/admin/dashboard'),
  getUsers: (params = '') => api.get(`/api/admin/users${params ? '?' + params : ''}`),
  updateUserRole: (id, role) => api.put(`/api/admin/users/${id}/role`, { role }),
  toggleUserActive: (id) => api.put(`/api/admin/users/${id}/toggle`),
  getAllRestaurants: (params = '') => api.get(`/api/admin/restaurants${params ? '?' + params : ''}`),
  getRevenueAnalytics: (days) => api.get(`/api/admin/analytics/revenue?days=${days || 30}`),
  getOrderAnalytics: (days) => api.get(`/api/admin/analytics/orders?days=${days || 30}`),
  getFinanceSummary: (days) => api.get(`/api/admin/finance/summary?days=${days || 30}`),
  getSettlements: (params = '') => api.get(`/api/admin/settlements${params ? '?' + params : ''}`),
  generateSettlement: (data) => api.post('/api/admin/settlements', data),
  markSettlementPaid: (id, data = {}) => api.put(`/api/admin/settlements/${id}/paid`, data),
};

// ── Payment API ─────────────────────────────────────────────────────────────

export const paymentAPI = {
  createIntent: (amount, orderId, checkout = null) => api.post(
    '/api/payments/create-intent',
    checkout || { amount, orderId }
  ),
};

// ── Inventory & Supplier API ────────────────────────────────────────────────

export const inventoryAPI = {
  getInventory: (restaurantId) => api.get(`/api/inventory/restaurant/${restaurantId}`),
  createItem: (restaurantId, data) => api.post(`/api/inventory/restaurant/${restaurantId}`, data),
  updateItem: (itemId, data) => api.put(`/api/inventory/${itemId}`, data),
  deleteItem: (itemId) => api.delete(`/api/inventory/${itemId}`),
  receiveShipment: (itemId, data) => api.post(`/api/inventory/${itemId}/receive`, data),
  logWastage: (itemId, data) => api.post(`/api/inventory/${itemId}/wastage`, data),
};

export const supplierAPI = {
  getAll: (restaurantId) => api.get(`/api/suppliers/restaurant/${restaurantId}`),
  create: (restaurantId, data) => api.post(`/api/suppliers/restaurant/${restaurantId}`, data),
  update: (id, data) => api.put(`/api/suppliers/${id}`, data),
  delete: (id) => api.delete(`/api/suppliers/${id}`),
};

// ── Table API ───────────────────────────────────────────────────────────────

export const tableAPI = {
  getAll: (restaurantId) => api.get(`/api/tables/${restaurantId}`),
  create: (data) => api.post('/api/tables', data),
  update: (id, data) => api.put(`/api/tables/${id}`, data),
  delete: (id) => api.delete(`/api/tables/${id}`),
  updateStatus: (id, status, currentOrderId = null) => api.put(`/api/tables/${id}/status`, { status, currentOrderId }),
  move: (data) => api.post('/api/tables/move', data),
  merge: (data) => api.post('/api/tables/merge', data),
};

// ── Reservation API ─────────────────────────────────────────────────────────

export const reservationAPI = {
  create: (data) => api.post('/api/reservations', data),
  getMyReservations: () => api.get('/api/reservations/my-reservations'),
  getRestaurantReservations: (restaurantId) => api.get(`/api/reservations/restaurant/${restaurantId}`),
  updateStatus: (id, status, tableId = null) => api.put(`/api/reservations/${id}/status`, { status, tableId }),
};

// ── Catering API ────────────────────────────────────────────────────────────

export const cateringAPI = {
  submitInquiry: (data) => api.post('/api/catering', data),
  getRestaurantInquiries: (restaurantId) => api.get(`/api/catering/restaurant/${restaurantId}`),
  updateStatus: (id, status) => api.put(`/api/catering/${id}/status`, { status }),
};

// ── Notification API ────────────────────────────────────────────────────────

export const notificationAPI = {
  getMyNotifications: () => api.get('/api/notifications'),
  markAsRead: (id) => api.put(`/api/notifications/${id}/read`),
};

// ── Loyalty API ─────────────────────────────────────────────────────────────

export const loyaltyAPI = {
  getHistory: (params = '') => api.get(`/api/loyalty/history${params ? '?' + params : ''}`),
};

// ── Employee API ────────────────────────────────────────────────────────────

export const employeeAPI = {
  getEmployees: (restaurantId) => api.get(`/api/employees/restaurant/${restaurantId}`),
  createEmployee: (restaurantId, data) => api.post(`/api/employees/restaurant/${restaurantId}`, data),
  updateEmployee: (id, data) => api.put(`/api/employees/${id}`, data),
  removeEmployee: (id) => api.delete(`/api/employees/${id}`),
  clockInWithPin: (data) => api.post('/api/employees/pin/clock-in', data),
  clockOutWithPin: (data) => api.post('/api/employees/pin/clock-out', data),
  verifyPin: (data) => api.post('/api/employees/pin/verify', data),
  getPayroll: (restaurantId, startDate, endDate) => 
    api.get(`/api/employees/restaurant/${restaurantId}/payroll?startDate=${startDate}&endDate=${endDate}`),
  updateSchedule: (id, schedule) => api.put(`/api/employees/${id}/schedule`, { schedule }),
};

// ── Analytics API ───────────────────────────────────────────────────────────

export const analyticsAPI = {
  getSalesAnalytics: (restaurantId, days = 30) => api.get(`/api/analytics/restaurant/${restaurantId}?days=${days}`)
};

// ── CRM API ─────────────────────────────────────────────────────────────────

export const crmAPI = {
  getCustomers: (restaurantId) => api.get(`/api/crm/restaurant/${restaurantId}/customers`),
  sendPromo: (restaurantId, data) => api.post(`/api/crm/restaurant/${restaurantId}/promo`, data)
};

export const aiAPI = {
  predictSales: (restaurantId) => api.post('/api/ai/predict', { restaurantId }),
  smartPricing: (restaurantId) => api.post('/api/ai/smart-pricing', { restaurantId }),
  recommendFood: (restaurantId, pastOrdersContext) => api.post('/api/ai/recommend', { restaurantId, pastOrdersContext }),
};

// ── Reservation API ──────────────────────────────────────────────────────────

// export const reservationAPI = {
//   createReservation: (data) => api.post('/api/reservations', data),
//   getMyReservations: () => api.get('/api/reservations/my-reservations'),
//   getRestaurantReservations: (restaurantId) => api.get(`/api/reservations/restaurant/${restaurantId}`),
//   updateStatus: (id, status) => api.put(`/api/reservations/${id}/status`, { status }),
// };

// // ── Catering API ────────────────────────────────────────────────────────────

// export const cateringAPI = {
//   createInquiry: (data) => api.post('/api/catering', data),
//   getRestaurantInquiries: (restaurantId) => api.get(`/api/catering/restaurant/${restaurantId}`),
//   updateStatus: (id, status) => api.put(`/api/catering/${id}/status`, { status }),
// };

