import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { useSettingStore } from "@/store/setting";
import { shuffle } from "radash";
import apiKeyManager from "@/utils/api-key-manager";
import apiKeyStorage from "@/utils/api-key-storage";

export function useModelProvider() {
  const { apiKey = "", apiProxy, accessPassword } = useSettingStore();

  function createProvider(type: "google") {
    const apiKeys = shuffle(apiKey.split(","));
    
    console.log("Creating provider with API key available:", !!apiKey);
    
    // Store the API key in our storage service
    if (apiKey) {
      console.log("Storing API key in client-side storage");
      apiKeyStorage.storeApiKey(apiKey);
      
      // Also add to legacy API key manager for backward compatibility
      apiKeyManager.addKeys(apiKey);
    }
    
    // Create the key to use - either from user input or accessPassword
    if (!apiKeys[0] && !accessPassword) {
      throw new Error("No valid API key or access password provided. Please configure your settings.");
    }
    const keyToUse = apiKeys[0] || accessPassword;
    console.log("Using key type:", keyToUse ? "valid key" : "none");

    if (type === "google") {
      // Always use our server proxy to avoid CORS issues
      return createGoogleGenerativeAI({
        baseURL: "/api/ai/google/v1beta",
        apiKey: keyToUse,
        debug: process.env.NODE_ENV === "development", // Enable debug mode in development
        fetchOptions: {
          headers: {
            // Explicitly pass the API key as a header that our backend expects
            "x-api-key": keyToUse || ""
          }
        }
      });
    } else {
      throw new Error("Unsupported Provider: " + type);
    }
  }

  return {
    createProvider,
  };
}
