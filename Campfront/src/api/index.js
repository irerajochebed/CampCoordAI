import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor - Add JWT token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      if (error.response?.status === 401) {
        // Only redirect if user had a token (session expired), not on public pages
        const token = localStorage.getItem('token');
        if (token) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error:', error.request);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// ============================================
// AUTHENTICATION API
// ============================================
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  changePassword: (passwords) => api.post('/auth/change-password', passwords),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
};

// ============================================
// USER API
// ============================================
export const userApi = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  getByRole: (role) => api.get(`/users/role/${role}`),
  getByOrganization: (orgId) => api.get(`/users/organization/${orgId}`),
  search: (keyword) => api.get(`/users/search?keyword=${keyword}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  updateRolePosition: (id, data) => api.put(`/users/${id}/role-position`, data),
  provisionCoordinator: (data) => api.post('/users/provision-coordinator', data),
  activate: (id) => api.patch(`/users/${id}/activate`),
  deactivate: (id) => api.patch(`/users/${id}/deactivate`),
  delete: (id) => api.delete(`/users/${id}`),
};

// ============================================
// PROPOSAL API
// ============================================
export const proposalApi = {
  getAll: () => api.get('/proposals'),
  getById: (id) => api.get(`/proposals/${id}`),
  getByDepartment: (deptId) => api.get(`/proposals/department/${deptId}`),
  getByStatus: (status) => api.get(`/proposals/status/${status}`),
  getMyProposals: () => api.get('/proposals/my-proposals'),
  getPendingReview: () => api.get('/proposals/pending-review'),
  getPendingLeaderReview: () => api.get('/proposals/pending-leader-review'),
  getPendingAdminApproval: () => api.get('/proposals/pending-admin-approval'),
  getPendingReviewCount: () => api.get('/proposals/pending-review/count'),
  create: (data) => api.post('/proposals', data),
  update: (id, data) => api.put(`/proposals/${id}`, data),
  submit: (id) => api.patch(`/proposals/${id}/submit`),
  leaderReview: (id, data) => api.put(`/proposals/${id}/leader-review`, data),
  adminApproval: (id, data) => api.put(`/proposals/${id}/admin-approval`, data),
  approve: (id) => api.patch(`/proposals/${id}/approve`),
  reject: (id, comments) => api.patch(`/proposals/${id}/reject?comments=${encodeURIComponent(comments)}`),
  endorse: (id, comments) => api.patch(`/proposals/${id}/endorse?comments=${encodeURIComponent(comments)}`),
  requestRevision: (id, comments) => api.patch(`/proposals/${id}/request-revision?comments=${encodeURIComponent(comments)}`),
  review: (id, data) => api.post(`/proposals/${id}/review`, data),
  fieldReview: (id, data) => api.patch(`/proposals/${id}/field-review`, data),
  delete: (id) => api.delete(`/proposals/${id}`),
};

// ============================================
// EVENT API
// ============================================
export const eventApi = {
  getAll: () => api.get('/events'),
  getById: (id) => api.get(`/events/${id}`),
  getByDepartment: (deptId) => api.get(`/events/department/${deptId}`),
  getByStatus: (status) => api.get(`/events/status/${status}`),
  getUpcoming: () => api.get('/events/upcoming'),
  getMyEvents: () => api.get('/events/my-events'),
  create: (data) => api.post('/events', data),
  createFromProposal: (proposalId, coordinatorId) => 
    api.post(`/events/from-proposal/${proposalId}?coordinatorId=${coordinatorId}`),
  update: (id, data) => api.put(`/events/${id}`, data),
  openRegistration: (id) => api.patch(`/events/${id}/open-registration`),
  closeRegistration: (id) => api.patch(`/events/${id}/close-registration`),
  start: (id) => api.patch(`/events/${id}/start`),
  complete: (id) => api.patch(`/events/${id}/complete`),
  cancel: (id) => api.patch(`/events/${id}/cancel`),
  assignStaff: (eventId, data) => api.post(`/events/${eventId}/assign-staff`, data),
  getStaff: (eventId) => api.get(`/events/${eventId}/staff`),
  removeStaffAssignment: (assignmentId) => api.delete(`/events/staff/${assignmentId}`),
  delete: (id) => api.delete(`/events/${id}`),
};

// ============================================
// SESSION API
// ============================================
export const sessionApi = {
  getById: (id) => api.get(`/sessions/${id}`),
  getByEvent: (eventId) => api.get(`/sessions/event/${eventId}`),
  getBySpeaker: (speakerId) => api.get(`/sessions/speaker/${speakerId}`),
  create: (eventId, data) => api.post(`/sessions/event/${eventId}`, data),
  update: (id, data) => api.put(`/sessions/${id}`, data),
  delete: (id) => api.delete(`/sessions/${id}`),
};

// ============================================
// REGISTRATION API
// ============================================
export const registrationApi = {
  getAll: () => api.get('/registrations'),
  getById: (id) => api.get(`/registrations/${id}`),
  getByEvent: (eventId) => api.get(`/registrations/event/${eventId}`),
  getByParticipant: (participantId) => api.get(`/registrations/participant/${participantId}`),
  getByStatus: (eventId, status) => api.get(`/registrations/event/${eventId}/status/${status}`),
  getMyRegistrations: () => api.get('/registrations/my-registrations'),
  create: (data) => api.post('/registrations', data),
  update: (id, data) => api.put(`/registrations/${id}`, data),
  confirm: (id) => api.patch(`/registrations/${id}/confirm`),
  cancel: (id) => api.patch(`/registrations/${id}/cancel`),
  checkIn: (id) => api.post(`/registrations/${id}/check-in`),
  checkInByQR: (qrCode) => api.post(`/registrations/check-in/qr/${qrCode}`),
  checkOut: (id) => api.post(`/registrations/${id}/check-out`),
  delete: (id) => api.delete(`/registrations/${id}`),
};

// ============================================
// PAYMENT API
// ============================================
export const paymentApi = {
  getById: (id) => api.get(`/payments/${id}`),
  getByRegistration: (regId) => api.get(`/payments/registration/${regId}`),
  getByEvent: (eventId) => api.get(`/payments/event/${eventId}`),
  getPending: (eventId) => api.get(`/payments/event/${eventId}/pending`),
  getTotalByEvent: (eventId) => api.get(`/payments/event/${eventId}/total`),
  getTotalVerified: (eventId) => api.get(`/payments/event/${eventId}/verified-total`),
  submit: (data) => api.post('/payments', data),
  verify: (id, notes) => api.patch(`/payments/${id}/verify`, { notes }),
  reject: (id, reason) => api.patch(`/payments/${id}/reject`, { reason }),
  delete: (id) => api.delete(`/payments/${id}`),
};

// ============================================
// ACCOMMODATION API
// ============================================
export const accommodationApi = {
  getById: (id) => api.get(`/accommodations/${id}`),
  getByEvent: (eventId) => api.get(`/accommodations/event/${eventId}`),
  getEventCapacity: (eventId) => api.get(`/accommodations/event/${eventId}/capacity`),
  create: (eventId, data) => api.post(`/accommodations/event/${eventId}`, data),
  update: (id, data) => api.put(`/accommodations/${id}`, data),
  delete: (id) => api.delete(`/accommodations/${id}`),
  
  // Room management
  getRoomById: (id) => api.get(`/accommodations/rooms/${id}`),
  getRoomsByAccommodation: (accommodationId) => api.get(`/accommodations/${accommodationId}/rooms`),
  getAvailableRooms: (accommodationId) => api.get(`/accommodations/${accommodationId}/rooms/available`),
  createRoom: (accommodationId, data) => api.post(`/accommodations/${accommodationId}/rooms`, data),
  updateRoom: (id, data) => api.put(`/accommodations/rooms/${id}`, data),
  deleteRoom: (id) => api.delete(`/accommodations/rooms/${id}`),
  
  // Room assignment
  assignRoom: (data) => api.post('/accommodations/assign', data),
  getAssignmentById: (id) => api.get(`/accommodations/assignments/${id}`),
  getAssignmentByRegistration: (regId) => api.get(`/accommodations/assignments/registration/${regId}`),
  getAssignmentsByRoom: (roomId) => api.get(`/accommodations/rooms/${roomId}/assignments`),
  releaseAssignment: (id) => api.patch(`/accommodations/assignments/${id}/release`),
};

// ============================================
// ATTENDANCE API
// ============================================
export const attendanceApi = {
  getById: (id) => api.get(`/attendance/${id}`),
  getBySession: (sessionId) => api.get(`/attendance/session/${sessionId}`),
  getByRegistration: (regId) => api.get(`/attendance/registration/${regId}`),
  getByEvent: (eventId) => api.get(`/attendance/event/${eventId}`),
  getSessionCount: (sessionId) => api.get(`/attendance/session/${sessionId}/count`),
  getEventCount: (eventId, regId) => api.get(`/attendance/event/${eventId}/registration/${regId}/count`),
  checkAttendance: (sessionId, regId) => api.get(`/attendance/session/${sessionId}/registration/${regId}/check`),
  recordManual: (sessionId, regId) => api.post(`/attendance/session/${sessionId}/registration/${regId}`),
  recordByQR: (sessionId, qrCode) => api.post(`/attendance/session/${sessionId}/qr-scan?qrCode=${qrCode}`),
  checkIn: (data) => api.post('/attendance/check-in', data),
  searchParticipant: (params) => api.get('/attendance/search', { params }),
  exportReport: (sessionId, format) => api.get(`/attendance/session/${sessionId}/export?format=${format}`, { responseType: 'blob' }),
  delete: (id) => api.delete(`/attendance/${id}`),
};

// ============================================
// RESOURCE API
// ============================================
export const resourceApi = {
  getAll: () => api.get('/resources'),
  getById: (id) => api.get(`/resources/${id}`),
  getByType: (type) => api.get(`/resources/type/${type}`),
  getAvailable: () => api.get('/resources/available'),
  getAvailableByType: (type) => api.get(`/resources/available/type/${type}`),
  search: (keyword) => api.get(`/resources/search?keyword=${keyword}`),
  create: (data) => api.post('/resources', data),
  update: (id, data) => api.put(`/resources/${id}`, data),
  delete: (id) => api.delete(`/resources/${id}`),
  
  // Resource allocation
  allocate: (data) => api.post('/resources/allocate', data),
  getAllocationById: (id) => api.get(`/resources/allocations/${id}`),
  getAllocationsByResource: (resourceId) => api.get(`/resources/${resourceId}/allocations`),
  getAllocationsByEvent: (eventId) => api.get(`/resources/allocations/event/${eventId}`),
  getUnreturnedAllocations: (eventId) => api.get(`/resources/allocations/event/${eventId}/unreturned`),
  returnAllocation: (allocationId) => api.patch(`/resources/allocations/${allocationId}/return`),
  cancelAllocation: (allocationId) => api.delete(`/resources/allocations/${allocationId}`),
};

// ============================================
// NOTIFICATION API
// ============================================
export const notificationApi = {
  getById: (id) => api.get(`/notifications/${id}`),
  getMyNotifications: () => api.get('/notifications/my-notifications'),
  getUnread: () => api.get('/notifications/unread'),
  getUnreadCount: () => api.get('/notifications/unread/count'),
  getByEvent: (eventId) => api.get(`/notifications/event/${eventId}`),
  create: (data) => api.post('/notifications', data),
  createBulk: (data) => api.post('/notifications/bulk', data),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/mark-all-read'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// ============================================
// QR CODE API
// ============================================
export const qrCodeApi = {
  getRegistrationQRImage: (registrationId) => 
    api.get(`/qrcode/registration/${registrationId}/image`, { responseType: 'blob' }),
  getRegistrationQRBase64: (registrationId) => 
    api.get(`/qrcode/registration/${registrationId}/base64`),
  generateQRCode: (data) => api.post('/qrcode/generate', data),
};

// ============================================
// DEPARTMENT API (if needed)
// ============================================
export const departmentApi = {
  getAll: () => api.get('/departments'),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

// ============================================
// ORGANIZATION API (if needed)
// ============================================
export const organizationApi = {
  getAll: () => api.get('/organization-units'),
  getChildren: (parentId) => api.get('/v1/org-units/children' + (parentId ? `?parentId=${parentId}` : '')),
  getFields: () => api.get('/v1/org-units/fields'),
  getById: (id) => api.get(`/organization-units/${id}`),
  getByLevel: (level) => api.get(`/organization-units/level/${level}`),
  create: (data) => api.post('/organization-units', data),
  update: (id, data) => api.put(`/organization-units/${id}`, data),
  delete: (id) => api.delete(`/organization-units/${id}`),
};

// ============================================
// ANALYTICS API
// ============================================
export const analyticsApi = {
  getAdminDashboardStats: () => api.get('/analytics/dashboard/admin'),
  getCoordinatorDashboardStats: (coordinatorId) => api.get('/analytics/dashboard/coordinator'),
};

export default api;
