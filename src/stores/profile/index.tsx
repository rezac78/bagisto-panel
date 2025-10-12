import { create } from "zustand";
import { persist } from "zustand/middleware";

import { UserData } from "@/utils/types/Login";

interface AuthState {
  user: UserData | null;
  setAuth: (user: UserData) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setAuth: (user) => set({ user }),
      clearAuth: () => set({ user: null }),
    }),
    {
      name: "auth-storage",
    },
  ),
);
