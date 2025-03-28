import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { useSettingStore } from "@/store/setting";
import { shuffle } from "radash";

export function useModelProvider() {
  const { apiKey = "", apiProxy, accessPassword } = useSettingStore();

  function createProvider(type: "google") {
    const apiKeys = shuffle(apiKey.split(","));
    
    // Create the key to use - either from user input or accessPassword
    const keyToUse = apiKeys[0] || accessPassword || "dummy-key";

    if (type === "google") {
      // Always use our server proxy to avoid CORS issues
      return createGoogleGenerativeAI({
        baseURL: "/api/ai/google/v1beta",
        apiKey: keyToUse,
      });
    } else {
      throw new Error("Unsupported Provider: " + type);
    }
  }

  return {
    createProvider,
  };
}
