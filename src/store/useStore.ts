import { create } from "zustand";

// Define your store state type
interface StoreState {
  // Add your state properties here
}

// Create the store
export const useStore = create<StoreState>(() => ({
  // Initial state
}));
