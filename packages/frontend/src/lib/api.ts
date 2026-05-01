import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { "Content-Type": "application/json" },
});

// Attach auth token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; fullName: string; businessName: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  getProfile: () => api.get("/auth/me"),
};

// ─── Clients ──────────────────────────────────────────────────
export const clientsApi = {
  list: (params?: { page?: number; search?: string }) =>
    api.get("/clients", { params }),
  get: (id: string) => api.get(`/clients/${id}`),
  create: (data: { name: string; email?: string; platform?: string; platformUsername?: string }) =>
    api.post("/clients", data),
  update: (id: string, data: Partial<{ name: string; email: string; platform: string }>) =>
    api.put(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
};

// ─── Knowledge ────────────────────────────────────────────────
export const knowledgeApi = {
  list: (category?: string) => api.get("/knowledge", { params: { category } }),
  create: (data: { category: string; title: string; content: string }) =>
    api.post("/knowledge", data),
  update: (id: string, data: Partial<{ category: string; title: string; content: string }>) =>
    api.put(`/knowledge/${id}`, data),
  delete: (id: string) => api.delete(`/knowledge/${id}`),
};

// ─── Services ─────────────────────────────────────────────────
export const servicesApi = {
  list: () => api.get("/services"),
  create: (data: { name: string; basePrice: number; description?: string; deliveryTimeDays?: number }) =>
    api.post("/services", data),
  update: (id: string, data: Partial<{ name: string; basePrice: number }>) =>
    api.put(`/services/${id}`, data),
  delete: (id: string) => api.delete(`/services/${id}`),
};

// ─── Proposals ────────────────────────────────────────────────
export const proposalsApi = {
  list: (params?: { status?: string }) => api.get("/proposals", { params }),
  generate: (data: { projectDescription: string; clientBudget?: number; clientTimeline?: string }) =>
    api.post("/proposals/generate", data),
  create: (data: { title: string; content: string; pricing?: object }) =>
    api.post("/proposals", data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/proposals/${id}/status`, { status }),
};

// ─── Conversations ────────────────────────────────────────────
export const conversationsApi = {
  list: (params?: { platform?: string }) => api.get("/conversations", { params }),
  get: (id: string) => api.get(`/conversations/${id}`),
  sendMessage: (data: { clientId: string; platform: string; message: string; autoReply?: boolean }) =>
    api.post("/conversations/message", data),
};

// ─── Meetings ─────────────────────────────────────────────────
export const meetingsApi = {
  list: (upcoming?: boolean) => api.get("/meetings", { params: { upcoming } }),
  create: (data: { title: string; platform: string; scheduledAt: string; clientId?: string }) =>
    api.post("/meetings", data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/meetings/${id}/status`, { status }),
};

// ─── Billing ──────────────────────────────────────────────────
export const billingApi = {
  getPlans: () => api.get("/billing/plans"),
  getSubscription: () => api.get("/billing/subscription"),
  checkout: (plan: string) => api.post("/billing/checkout", { plan }),
};

// ─── Automation ───────────────────────────────────────────────
export const automationApi = {
  getSessions: () => api.get("/automation/sessions"),
  run: (data: { platform: string; action: string; config?: object }) =>
    api.post("/automation/run", data),
  stop: (sessionId: string) => api.post(`/automation/stop/${sessionId}`),
};

// ─── Negotiation ──────────────────────────────────────────────
export const negotiationApi = {
  getRules: () => api.get("/negotiation/rules"),
  createRule: (data: { serviceId?: string; minPrice: number; maxDiscountPercent?: number }) =>
    api.post("/negotiation/rules", data),
  negotiate: (data: { clientId: string; serviceId: string; clientMessage: string; proposedPrice?: number }) =>
    api.post("/negotiation/negotiate", data),
};

// ─── Admin ────────────────────────────────────────────────────
export const adminApi = {
  getTenants: () => api.get("/admin/tenants"),
  getTenant: (id: string) => api.get(`/admin/tenants/${id}`),
  updateTenantStatus: (id: string, status: string) =>
    api.patch(`/admin/tenants/${id}/status`, { status }),
  getStats: () => api.get("/admin/stats"),
};

export default api;
