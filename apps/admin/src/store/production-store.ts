import { create } from 'zustand';
import type { ProductionView, ProductionStation } from '@/types/production';

interface ProductionState {
  // Navigation
  currentView: ProductionView;
  setView: (view: ProductionView) => void;

  // Active station (for production operators)
  activeStation: ProductionStation | null;
  setActiveStation: (station: ProductionStation | null) => void;

  // Scanner
  scannerEnabled: boolean;
  toggleScanner: () => void;

  // Selected work order
  selectedWorkOrderId: string | null;
  setSelectedWorkOrder: (id: string | null) => void;

  // Filters
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  priorityFilter: string;
  setPriorityFilter: (priority: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

export const useProductionStore = create<ProductionState>((set) => ({
  currentView: 'ventas',
  setView: (view) => set({ currentView: view, selectedWorkOrderId: null }),

  activeStation: null,
  setActiveStation: (station) => set({ activeStation: station }),

  scannerEnabled: false,
  toggleScanner: () => set((s) => ({ scannerEnabled: !s.scannerEnabled })),

  selectedWorkOrderId: null,
  setSelectedWorkOrder: (id) => set({ selectedWorkOrderId: id }),

  statusFilter: 'all',
  setStatusFilter: (status) => set({ statusFilter: status, currentPage: 1 }),
  priorityFilter: 'all',
  setPriorityFilter: (priority) => set({ priorityFilter: priority, currentPage: 1 }),
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q, currentPage: 1 }),
  currentPage: 1,
  setCurrentPage: (page) => set({ currentPage: page }),
}));
