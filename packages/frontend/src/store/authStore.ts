import { create } from "zustand";
import { authApi } from "@/lib/api";

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  tenantId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; fullName: string; businessName: string }) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  tenantId: typeof window !== "undefined" ? localStorage.getItem("tenantId") : null,
  isLoading: false,
  isAuthenticated: typeof window !== "undefined" ? !!localStorage.getItem("token") : false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await authApi.login({ email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("tenantId", data.tenantId);
      set({
        user: data.user,
        token: data.token,
        tenantId: data.tenantId,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (registerData) => {
    set({ isLoading: true });
    try {
      const { data } = await authApi.register(registerData);
      localStorage.setItem("token", data.token);
      localStorage.setItem("tenantId", data.tenantId);
      set({
        user: data.user,
        token: data.token,
        tenantId: data.tenantId,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("tenantId");
    set({ user: null, token: null, tenantId: null, isAuthenticated: false });
  },

  loadUser: async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    set({ isLoading: true });
    try {
      const { data } = await authApi.getProfile();
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("tenantId");
      set({ user: null, token: null, tenantId: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
