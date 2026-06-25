import axios from "axios";
import { useAuthStore } from "../store/auth.store";

// Use direct location origin safely as api gateway base
const API_BASE = "/api/v1";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: AttachaccessToken from Zustand memory store
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: auto-retrieve rotated access token on 401 intercepts
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error status is 401 and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Try to obtain a new token using the cookies refresh route
        const refreshResponse = await axios.post(
          "/api/v1/auth/refresh",
          {},
          { withCredentials: true }
        );
        
        const newAccessToken = refreshResponse.data?.data?.accessToken;
        if (newAccessToken) {
          useAuthStore.getState().setAccessToken(newAccessToken);
          
          // Retry original query with the updated headers
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.warn("Automated refresh token cycle failed:", refreshError);
        useAuthStore.getState().logout();
        // Redirect to login safely inside SPA context
        if (typeof window !== "undefined") {
          window.location.hash = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
