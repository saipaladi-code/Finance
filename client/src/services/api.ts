const API_BASE = '/api';

export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

export const setAuthToken = (token: string | null): void => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

const request = async <T = any>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({ success: false, message: 'Server communication error.' }));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
};

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData: any) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getMe: () => request('/auth/me'),
  forgotPassword: (email: string) =>
    request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (payload: { token: string; newPassword: string }) =>
    request('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    request('/auth/change-password', { method: 'POST', body: JSON.stringify(payload) }),

  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),

  // Customers
  getCustomers: (params?: { search?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/customers${query ? `?${query}` : ''}`);
  },
  getCustomerById: (id: string) => request(`/customers/${id}`),
  createCustomer: (customerData: any) =>
    request('/customers', { method: 'POST', body: JSON.stringify(customerData) }),
  updateCustomer: (id: string, customerData: any) =>
    request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(customerData) }),
  deleteCustomer: (id: string) => request(`/customers/${id}`, { method: 'DELETE' }),

  // Daily Finance
  getDailyAccounts: (params?: { search?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/daily-finance${query ? `?${query}` : ''}`);
  },
  getDailyAccountById: (id: string) => request(`/daily-finance/${id}`),
  createDailyAccount: (accountData: any) =>
    request('/daily-finance', { method: 'POST', body: JSON.stringify(accountData) }),
  recordDailyPayment: (id: string, paymentData: any) =>
    request(`/daily-finance/${id}/payments`, { method: 'POST', body: JSON.stringify(paymentData) }),

  // Weekly Finance
  getWeeklyAccounts: (params?: { search?: string; status?: string; collectionDay?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/weekly-finance${query ? `?${query}` : ''}`);
  },
  getWeeklyAccountById: (id: string) => request(`/weekly-finance/${id}`),
  createWeeklyAccount: (accountData: any) =>
    request('/weekly-finance', { method: 'POST', body: JSON.stringify(accountData) }),
  recordWeeklyPayment: (id: string, paymentData: any) =>
    request(`/weekly-finance/${id}/payments`, { method: 'POST', body: JSON.stringify(paymentData) }),

  // Chitti
  getChitGroups: (params?: { status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/chitti/groups${query ? `?${query}` : ''}`);
  },
  getChitGroupById: (id: string) => request(`/chitti/groups/${id}`),
  createChitGroup: (groupData: any) =>
    request('/chitti/groups', { method: 'POST', body: JSON.stringify(groupData) }),
  addChitMember: (groupId: string, memberData: any) =>
    request(`/chitti/groups/${groupId}/members`, { method: 'POST', body: JSON.stringify(memberData) }),
  conductAuction: (groupId: string, auctionData: any) =>
    request(`/chitti/groups/${groupId}/auctions`, { method: 'POST', body: JSON.stringify(auctionData) }),
  recordChitPayment: (groupId: string, paymentData: any) =>
    request(`/chitti/groups/${groupId}/payments`, { method: 'POST', body: JSON.stringify(paymentData) }),

  // Payments
  getPayments: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return request(`/payments${query ? `?${query}` : ''}`);
  },
  getPaymentById: (id: string) => request(`/payments/${id}`),
  reversePayment: (id: string, reason: string) =>
    request(`/payments/${id}/reverse`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Reports
  getDailyReport: (date?: string) => request(`/reports/daily${date ? `?date=${date}` : ''}`),
  getWeeklyReport: (params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams(params).toString();
    return request(`/reports/weekly${query ? `?${query}` : ''}`);
  },
  getMonthlyReport: (params?: { month?: number; year?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/reports/monthly${query ? `?${query}` : ''}`);
  },

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (settingsData: any) =>
    request('/settings', { method: 'PUT', body: JSON.stringify(settingsData) }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationAsRead: (id: string) => request(`/notifications/${id}/read`, { method: 'PUT' }),
};
