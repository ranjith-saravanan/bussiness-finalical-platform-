const BASE_URL = '/api/v1';

export function getAuthToken(): string | null {
  return localStorage.getItem('mybiz_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('mybiz_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('mybiz_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    removeAuthToken();
    if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    let errorDetail = 'An error occurred';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || JSON.stringify(errJson);
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

export const api = {
  // Auth
  register: (data: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<any>('/auth/me'),

  // Dashboard
  getDashboard: (taxRate?: number, safetyBuffer?: number) => {
    const q = new URLSearchParams();
    if (taxRate !== undefined) q.append('tax_rate', taxRate.toString());
    if (safetyBuffer !== undefined) q.append('custom_safety_buffer', safetyBuffer.toString());
    const qs = q.toString();
    return request<any>(`/dashboard${qs ? `?${qs}` : ''}`);
  },

  // Income
  getIncomes: () => request<any[]>('/income'),
  createIncome: (data: any) => request<any>('/income', { method: 'POST', body: JSON.stringify(data) }),
  deleteIncome: (id: number) => request<void>(`/income/${id}`, { method: 'DELETE' }),

  // Expenses
  getExpenses: () => request<any[]>('/expenses'),
  createExpense: (data: any) => request<any>('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  deleteExpense: (id: number) => request<void>(`/expenses/${id}`, { method: 'DELETE' }),

  // Budgets
  getBudgets: () => request<any[]>('/budgets'),
  getBudgetStatus: (month?: number, year?: number) => {
    const q = new URLSearchParams();
    if (month) q.append('month', month.toString());
    if (year) q.append('year', year.toString());
    return request<any[]>(`/budgets/status?${q.toString()}`);
  },
  createBudget: (data: any) => request<any>('/budgets', { method: 'POST', body: JSON.stringify(data) }),
  deleteBudget: (id: number) => request<void>(`/budgets/${id}`, { method: 'DELETE' }),

  // Savings
  getSavings: () => request<any[]>('/savings'),
  createSavings: (data: any) => request<any>('/savings', { method: 'POST', body: JSON.stringify(data) }),
  updateSavings: (id: number, current_amount: number) => request<any>(`/savings/${id}?current_amount=${current_amount}`, { method: 'PUT' }),
  deleteSavings: (id: number) => request<void>(`/savings/${id}`, { method: 'DELETE' }),

  // Cashflow
  getCashFlow: () => request<any[]>('/cashflow'),

  // Businesses
  getBusinesses: () => request<any[]>('/businesses'),
  createBusiness: (data: any) => request<any>('/businesses', { method: 'POST', body: JSON.stringify(data) }),
  deleteBusiness: (id: number) => request<void>(`/businesses/${id}`, { method: 'DELETE' }),

  // Customers
  getCustomers: (business_id?: number) => request<any[]>(`/customers${business_id ? `?business_id=${business_id}` : ''}`),
  createCustomer: (data: any) => request<any>('/customers', { method: 'POST', body: JSON.stringify(data) }),
  deleteCustomer: (id: number) => request<void>(`/customers/${id}`, { method: 'DELETE' }),

  // Products
  getProducts: (business_id?: number) => request<any[]>(`/products${business_id ? `?business_id=${business_id}` : ''}`),
  createProduct: (data: any) => request<any>('/products', { method: 'POST', body: JSON.stringify(data) }),
  deleteProduct: (id: number) => request<void>(`/products/${id}`, { method: 'DELETE' }),

  // Sales
  getSales: (business_id?: number) => request<any[]>(`/sales${business_id ? `?business_id=${business_id}` : ''}`),
  getSalesSummary: (business_id?: number) => request<any>(`/sales/summary${business_id ? `?business_id=${business_id}` : ''}`),
  createSale: (data: any) => request<any>('/sales', { method: 'POST', body: JSON.stringify(data) }),
  deleteSale: (id: number) => request<void>(`/sales/${id}`, { method: 'DELETE' }),

  // Commitments
  getCommitments: () => request<any>('/commitments'),

  // Business Transactions
  getBusinessTransactions: (business_id?: number, type?: string) => {
    const q = new URLSearchParams();
    if (business_id) q.append('business_id', business_id.toString());
    if (type) q.append('type', type);
    return request<any[]>(`/business-transactions?${q.toString()}`);
  },
  createBusinessTransaction: (data: any) => request<any>('/business-transactions', { method: 'POST', body: JSON.stringify(data) }),
  deleteBusinessTransaction: (id: number) => request<void>(`/business-transactions/${id}`, { method: 'DELETE' }),

  // Analytics
  getPersonalAnalytics: () => request<any>('/analytics/personal'),
  getBusinessAnalytics: (business_id?: number) => request<any>(`/analytics/business${business_id ? `?business_id=${business_id}` : ''}`),

  // Forecast
  getForecast: () => request<any>('/forecast'),

  // AI Advisor
  chatWithAdvisor: (question: string, business_id?: number) => request<any>('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ question, business_id })
  }),
  getAIRecommendations: (business_id?: number) => request<any[]>(`/ai/recommendations${business_id ? `?business_id=${business_id}` : ''}`),

  // Notifications
  getNotifications: () => request<any[]>('/notifications'),
  generateNotifications: () => request<any[]>('/notifications/generate', { method: 'POST' }),
  markNotificationRead: (id: number) => request<any>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request<any>('/notifications/read-all', { method: 'POST' }),

  // Export
  getExportUrl: (dataType: string) => `${BASE_URL}/export/csv?data_type=${dataType}`
};
