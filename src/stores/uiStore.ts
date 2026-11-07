import { create } from 'zustand';

export type NavTab = 'dashboard' | 'members' | 'attendance' | 'payments' | 'more';
export type ThemeMode = 'dark' | 'light';

interface UiState {
  activeTab: NavTab;
  theme: ThemeMode;
  setActiveTab: (tab: NavTab) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeTab: 'dashboard',
  theme: 'dark',

  setActiveTab: (tab: NavTab) => set({ activeTab: tab }),

  setTheme: (theme: ThemeMode) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },

  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { theme: nextTheme };
    }),
}));

