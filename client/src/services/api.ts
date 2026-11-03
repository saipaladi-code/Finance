/**
 * Smart Finance Management System API Client
 * Supports dynamic production Render backend URL via VITE_API_URL
 * and seamless fallback for local Vite proxy
 */

export const getApiBaseUrl = (): string => {
  // 1. Explicit environment variable configured in Vercel or client .env
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    let clean = envUrl.trim().replace(/\/+$/, '');
    if (!clean.endsWith('/api')) {
      clean = `${clean}/api`;
    }
    return clean;
  }

  // 2. Allow runtime override from window (e.g. for testing / debugging)
  if (typeof window !== 'undefined' && (window as any).__FINANCE_API_URL__) {
    let custom = (window as any).__FINANCE_API_URL__.trim().replace(/\/+$/, '');
    if (!custom.endsWith('/api')) {
      custom = `${custom}/api`;
    }
    return custom;
  }

  // 3. Fallback to relative /api (handled by Vite proxy in dev or reverse proxy in prod)
  return '/api';
};

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

  const baseUrl = getApiBaseUrl();
  let response: Response;

  try {
    response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch (netErr: any) {
    console.error('Network fetch failure connecting to backend:', baseUrl, endpoint, netErr);
    throw new Error(
      `Unable to connect to the backend server at ${baseUrl}. Please ensure your backend is running on Render and VITE_API_URL is properly configured in Vercel.`
    );
  }

  let data: any;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => ({
      success: false,
      message: 'Failed to parse JSON response from server.',
    }));
  } else {
    const text = await response.text();
    data = {
      success: false,
      message: response.ok
        ? text
        : `Server communication error (HTTP ${response.status}). Please check backend API URL.`,
    };
  }

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
};

export const api = {
  // Auth
  login: (credentials: { mobileNumber?: string; phone?: string; email?: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData: any) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getMe: () => request('/auth/me'),
  forgotPassword: (payload: { mobileNumber?: string; phone?: string; email?: string } | string) => {
    const body = typeof payload === 'string' ? { mobileNumber: payload } : payload;
    return request('/auth/forgot-password', { method: 'POST', body: JSON.stringify(body) });
  },
  requestOtp: (mobileNumber: string) =>
    request('/auth/request-otp', { method: 'POST', body: JSON.stringify({ mobileNumber }) }),
  verifyOtpAndReset: (payload: { mobileNumber: string; otp: string; newPassword: string }) =>
    request('/auth/verify-otp-reset', { method: 'POST', body: JSON.stringify(payload) }),
  resetPassword: (payload: { token?: string; otp?: string; mobileNumber?: string; newPassword: string }) =>
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
