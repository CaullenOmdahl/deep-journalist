import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GlobalStore {
  openSetting: boolean;
  openHistory: boolean;
  hasUsedBefore: boolean;
}

interface GlobalFunction {
  setOpenSetting: (visible: boolean) => void;
  setOpenHistory: (visible: boolean) => void;
  setHasUsedBefore: (value: boolean) => void;
}

export const useGlobalStore = create(
  persist<GlobalStore & GlobalFunction>(
    (set) => ({
      openSetting: false,
      openHistory: false,
      hasUsedBefore: false,
      setOpenSetting: (visible) => set({ openSetting: visible }),
      setOpenHistory: (visible) => set({ openHistory: visible }),
      setHasUsedBefore: (value) => set({ hasUsedBefore: value }),
    }),
    { name: "globalStore" }
  )
);
