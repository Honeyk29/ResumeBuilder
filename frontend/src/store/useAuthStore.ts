import { create } from 'zustand';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  token: string;
}

interface AuthState {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>((set) => {
  // Restore user from localStorage if exists
  const storedUser = localStorage.getItem('resume_user');
  const initialUser = storedUser ? JSON.parse(storedUser) : null;

  return {
    user: initialUser,
    login: (userData) => {
      localStorage.setItem('resume_user', JSON.stringify(userData));
      set({ user: userData });
    },
    logout: () => {
      localStorage.removeItem('resume_user');
      set({ user: null });
    },
  };
});

export default useAuthStore;
