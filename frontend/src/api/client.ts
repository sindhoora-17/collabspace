import axios from 'axios';

import { useAuthStore } from '../store/auth.store';

export const api = axios.create({
  baseURL:
    'http://localhost:3000/api/v1',
});

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(
        'accessToken',
      );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
);

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (
      error.response?.status === 401
    ) {
      useAuthStore
        .getState()
        .clearAuth();

      if (
        window.location.pathname !==
        '/login'
      ) {
        window.location.replace(
          '/login',
        );
      }
    }

    return Promise.reject(error);
  },
);