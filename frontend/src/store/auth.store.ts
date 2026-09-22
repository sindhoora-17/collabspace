import { create } from 'zustand';

type User = {
  id: string;
  email: string;
  displayName: string;
};

type AuthState = {
  accessToken: string | null;
  user: User | null;
  setAuth: (accessToken: string, user: User) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem('accessToken'),
  user: null,

  setAuth: (accessToken, user) => {
    localStorage.setItem('accessToken', accessToken);

    set({
      accessToken,
      user,
    });
  },

  clearAuth: () => {
    localStorage.removeItem('accessToken');

    set({
      accessToken: null,
      user: null,
    });
  },
}));