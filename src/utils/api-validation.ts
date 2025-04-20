/**
 * API validation utilities for Deep Journalist
 * 
 * Provides functions to validate API keys and populate models
 */

import { toast } from "sonner";
import logger from "@/utils/logger"; // Import the new logger

export interface ValidationResult {
  isValid: boolean;
  message: string;
  models?: string[];
  details?: any;
}

/**
 * Validate Google Generative AI API key and populate available models
 * 
 * @param apiKey API key or comma-separated list of API keys
 * @returns Validation result with status and available models
 */
export async function validateGoogleApiKey(apiKey: string): Promise<ValidationResult> {
  if (!apiKey || apiKey.trim() === '') {
    return {
      isValid: false,
      message: "Please enter an API key"
    };
  }

  try {
    // Extract the first API key for validation
    const keysToValidate = apiKey.split(',').map(key => key.trim()).filter(Boolean);
    
    if (keysToValidate.length === 0) {
      return {
        isValid: false,
        message: "No valid API keys found"
      };
    }

    // Check the first key to validate
    const testKey = keysToValidate[0];
    
    // Log the validation attempt (without exposing the full key)
    const maskedKey = maskApiKey(testKey);
    logger.info(`Validating Google API key: ${maskedKey}`);
    
    // Use the direct API URL for key validation
    const url = new URL("https://generativelanguage.googleapis.com/v1beta/models");
    url.searchParams.append("key", testKey);
    
    logger.info("Testing API key directly with Google's API...");
    const testResponse = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    // Handle test response
    if (!testResponse.ok) {
      logger.warn(`API key test failed with status: ${testResponse.status}`);
      
      const errorText = await testResponse.text();
      let errorMessage = "Invalid API key";
      let errorDetails = {};
      
      try {
        const errorData = JSON.parse(errorText);
        logger.warn("API validation error details:", errorData);
        
        // Extract detailed error message from Google API response
        if (errorData.error) {
          if (typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          } else if (errorData.error.message) {
            errorMessage = errorData.error.message;
            
            // Format common error messages to be more user-friendly
            if (errorMessage.includes("API key not valid")) {
              errorMessage = "Invalid API key. Please check your key and try again.";
            } else if (errorMessage.includes("quota")) {
              errorMessage = "API quota exceeded. Please try again later or use a different API key.";
            } else if (errorMessage.includes("permission")) {
              errorMessage = "API key doesn't have permission to access the Gemini API.";
            } else if (errorMessage.includes("billing")) {
              errorMessage = "Billing is not enabled for this API key. Please enable billing in your Google Cloud Console.";
            } else if (errorMessage.includes("disabled")) {
              errorMessage = "This API has been disabled for your project. Please enable it in your Google Cloud Console.";
            }
            
            errorDetails = errorData.error;
          }
        }
      } catch (e) {
        logger.error("Failed to parse error response:", errorText);
        // If we couldn't parse JSON, include the raw text for debugging
        if (errorText) {
          errorMessage = `Error response: ${errorText.substring(0, 100)}${errorText.length > 100 ? '...' : ''}`;
        }
      }
      
      return {
        isValid: false,
        message: errorMessage,
        details: errorDetails
      };
    }

    // At this point we know the API key is valid, so process the model data
    // from the direct API response we already have
    logger.info("API key test passed, processing available models...");
    try {
      const data = await testResponse.json();
      const models = data.models || [];
      
      logger.info(`Found ${models.length} models total from direct API call`);
      
      // Extract model names and filter for generateContent capability
      const modelNames = models
        .filter((model: any) => {
          const hasGenerateContent = model.supportedGenerationMethods?.includes('generateContent') ||
                                   model.supportedGenerationMethods?.includes('streamGenerateContent');
          return hasGenerateContent;
        })
        .map((model: any) => model.name.replace("models/", ""));
      
      logger.info(`Found ${modelNames.length} compatible models from direct API call`);
      
      // Import API key manager and add valid keys to it
      const apiKeyManager = (await import("@/utils/api-key-manager")).default;
      apiKeyManager.addKeys(apiKey);
      logger.info("Added validated API key to API key manager");
      
      if (modelNames.length === 0) {
        return {
          isValid: true,
          message: "API key is valid but no compatible models found. Your API key might not have access to Gemini models.",
          models: []
        };
      }
      
      return {
        isValid: true,
        message: `API key validated successfully. Found ${modelNames.length} available models.`,
        models: modelNames
      };
    } catch (e) {
      logger.error("Failed to process models from direct API call:", e);
      return {
        isValid: true,
        message: "API key is valid but we couldn't process the models list.",
        models: []
      };
    }
  } catch (error) {
    logger.error("API key validation error:", error);
    return {
      isValid: false,
      message: error instanceof Error 
        ? `Error validating API key: ${error.message}` 
        : "Unknown error validating API key. Check network connection and try again."
    };
  }
}

/**
 * Mask API key for safe logging
 */
function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) {
    return '****';
  }
  return `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
}