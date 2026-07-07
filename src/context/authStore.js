import { create } from "zustand";
import api from "../services/api.js";

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem("token") || null,
  loading: true, // Reste true tant que fetchMe n'a pas rendu son verdict

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      set({ user: data.user, token: data.token, loading: false });
      return data.user;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null, loading: false });
  },

  fetchMe: async () => {
    const currentToken = get().token;

    // S'il n'y a même pas de token, on arrête tout de suite le chargement
    if (!currentToken) {
      set({ user: null, loading: false });
      return;
    }

    try {
      const { data } = await api.get("/auth/me");
      set({ user: data.user, loading: false });
    } catch (error) {
      console.error("Erreur fetchMe, déconnexion...", error);
      localStorage.removeItem("token");
      set({ user: null, token: null, loading: false });
    }
  },

  updateSettings: async (updates) => {
    set({ loading: true });
    try {
      const { data } = await api.patch("/auth/settings", updates);
      set((state) => ({
        user: { ...state.user, ...data.user },
        loading: false,
      }));
      return data.user;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
}));
