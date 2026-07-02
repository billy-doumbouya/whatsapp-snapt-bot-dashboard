import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 30000,
});

// Injecter le token JWT automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Gérer les réponses en erreur
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Si l'erreur est un 401, on nettoie juste le token expiré localement
    if (err.response?.status === 401) {
      localStorage.removeItem("token");

      // OPTIONNEL : Si tu veux vraiment forcer la redirection depuis ici sans tout casser,
      // utilise l'historique de ton routeur ou vérifie qu'on n'est pas déjà sur /login
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  },
);

export default api;
