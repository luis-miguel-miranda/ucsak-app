import { create } from 'zustand';

interface BreadcrumbState {
  dynamicTitle: string | null;
  setDynamicTitle: (title: string | null) => void;
}

const useBreadcrumbStore = create<BreadcrumbState>((set) => ({
  dynamicTitle: null,
  setDynamicTitle: (title) => set({ dynamicTitle: title }),
}));

export default useBreadcrumbStore; 