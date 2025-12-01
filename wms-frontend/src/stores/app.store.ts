import { create } from 'zustand';
import { Customer } from '../types';

interface AppState {
  loading: boolean;
  customers: Customer[];
  setLoading: (loading: boolean) => void;
  setCustomers: (customers: Customer[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  loading: false,
  customers: [],

  setLoading: (loading) => set({ loading }),

  setCustomers: (customers) => set({ customers }),
}));
