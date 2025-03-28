import { useState } from "react";
import { useSettingStore } from "@/store/setting";
import { shuffle } from "radash";

type Model = {
  name: string;
  description: string;
  displayName: string;
  inputTokenLimit: number;
  maxTemperature?: number;
  outputTokenLimit: number;
  temperature?: number;
  topK?: number;
  topP?: number;
  supportedGenerationMethods: string[];
  version: string;
};

function useModel() {
  const [modelList, setModelList] = useState<string[]>([]);

  async function refresh(): Promise<string[]> {
    const {
      apiKey = "",
      apiProxy,
      accessPassword,
    } = useSettingStore.getState();
    const apiKeys = shuffle(apiKey.split(","));
    
    // Use either API key or access password
    const keyToUse = apiKeys[0] || accessPassword || "dummy-key";

    if (apiKey || accessPassword) {
      // Always use our server proxy for all requests
      const response = await fetch(
        "/api/ai/google/v1beta/models",
        {
          headers: {
            "x-goog-api-key": keyToUse,
          },
        }
      );
      const { models = [] } = await response.json();
      const newModelList = (models as Model[])
        .filter((item) =>
          item.supportedGenerationMethods.includes("generateContent")
        )
        .map((item) => item.name.replace("models/", ""));
      setModelList(newModelList);
      return newModelList;
    } else {
      return [];
    }
  }

  return {
    modelList,
    refresh,
  };
}

export default useModel;
