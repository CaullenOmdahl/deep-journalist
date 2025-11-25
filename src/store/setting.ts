import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SettingStore {
  apiKey: string;
  apiProxy: string;
  accessPassword: string;
  thinkingModel: string;
  networkingModel: string;
  language: string;
}

interface SettingFunction {
  update: (values: Partial<SettingStore>) => void;
}

export const defaultValues = {
  apiKey: "",
  apiProxy: "https://generativelanguage.googleapis.com",
  accessPassword: "",
  thinkingModel: "gemini-2.5-flash",
  networkingModel: "gemini-2.5-flash",
  language: "",
};

// Note: We no longer proactively migrate models. The rate limiter will
// detect unavailable models via actual API errors and suggest fallbacks.
// This preserves user choice and doesn't assume models are deprecated.

export const useSettingStore = create(
  persist<SettingStore & SettingFunction>(
    (set) => ({
      ...defaultValues,
      update: (values) => set(values),
    }),
    {
      name: "setting",
      version: 1,
    }
  )
);
