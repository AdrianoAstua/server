import { create } from 'zustand';
export const useProductionStore = create((set) => ({
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
