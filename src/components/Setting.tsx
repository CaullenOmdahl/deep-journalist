"use client";
import { useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw, Check, AlertTriangle, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import useModel from "@/hooks/useModel";
import { useSettingStore } from "@/store/setting";
import { cn } from "@/utils/style";
import { omit, capitalize } from "radash";
import ApiUsageStats from "./ApiUsageStats";
import { validateGoogleApiKey } from "@/utils/api-validation";
import { toast } from "sonner";

type SettingProps = {
  open: boolean;
  onClose: () => void;
};

const BUILD_MODE = process.env.NEXT_PUBLIC_BUILD_MODE;

const formSchema = z.object({
  apiKey: z.string().optional(),
  apiProxy: z.string().optional(),
  accessPassword: z.string().optional(),
  thinkingModel: z.string(),
  networkingModel: z.string(),
  language: z.string().optional(),
});

function convertModelName(name: string) {
  return name
    .split("-")
    .map((word) => capitalize(word))
    .join(" ");
}

function Setting({ open, onClose }: SettingProps) {
  const { t } = useTranslation();
  const { modelList, refresh, setModelList } = useModel();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoadingServerSettings, setIsLoadingServerSettings] = useState<boolean>(false);
  const [isValidatingApiKey, setIsValidatingApiKey] = useState<boolean>(false);
  const [apiKeyValidation, setApiKeyValidation] = useState<{
    status: 'idle' | 'validating' | 'valid' | 'invalid';
    message: string;
  }>({ status: 'idle', message: '' });
  const [formReady, setFormReady] = useState<boolean>(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: async () => {
      return new Promise((resolve) => {
        const state = useSettingStore.getState();
        
        // Provide default empty values to prevent uncontrolled to controlled warning
        const defaults = {
          apiKey: state.apiKey || '',
          apiProxy: state.apiProxy || 'https://generativelanguage.googleapis.com', // Set default API endpoint
          accessPassword: state.accessPassword || '',
          thinkingModel: state.thinkingModel || '',
          networkingModel: state.networkingModel || '',
          language: state.language || 'en-US',
        };
        
        resolve(defaults);
        
        // Mark the form as ready after setting defaults
        setTimeout(() => setFormReady(true), 0);
      });
    },
  });

  const watchApiKey = form.watch("apiKey");

  function handleClose(open: boolean) {
    if (!open) onClose();
  }

  function handleSubmit(values: z.infer<typeof formSchema>) {
    const { update } = useSettingStore.getState();
    
    // Ensure apiProxy is never empty or null - use the default
    const valuesToUpdate = {
      ...values,
      apiProxy: values.apiProxy || 'https://generativelanguage.googleapis.com'
    };
    
    update(valuesToUpdate);
    onClose();
  }

  async function validateApiKey(key: string) {
    if (!key) {
      setApiKeyValidation({ status: 'idle', message: '' });
      return;
    }
    
    try {
      setApiKeyValidation({ status: 'validating', message: 'Validating API key...' });
      setIsValidatingApiKey(true);
      
      const result = await validateGoogleApiKey(key);
      
      if (result.isValid) {
        setApiKeyValidation({ status: 'valid', message: result.message });
        
        // Update model list if models were returned
        if (result.models && result.models.length > 0) {
          setModelList(result.models);
          
          // Set default models if not already set
          if (!form.getValues("thinkingModel")) {
            // Prefer Gemini Pro model if available, or the first available model
            const defaultModel = result.models.find(model => 
              model.includes('gemini-pro') || model.includes('pro')
            ) || result.models[0];
            form.setValue("thinkingModel", defaultModel);
          }
          
          if (!form.getValues("networkingModel")) {
            // Prefer Gemini Pro model if available, or the first available model
            const defaultModel = result.models.find(model => 
              model.includes('gemini-pro') || model.includes('pro')
            ) || result.models[0];
            form.setValue("networkingModel", defaultModel);
          }
          
          toast.success("Models loaded successfully");
        }
      } else {
        setApiKeyValidation({ status: 'invalid', message: result.message });
      }
    } catch (error) {
      console.error("API key validation error:", error);
      setApiKeyValidation({ 
        status: 'invalid', 
        message: error instanceof Error ? error.message : "Unknown error validating API key"
      });
    } finally {
      setIsValidatingApiKey(false);
    }
  }

  // Handle API key validation when it changes
  useLayoutEffect(() => {
    const handler = setTimeout(() => {
      if (watchApiKey && watchApiKey !== useSettingStore.getState().apiKey) {
        validateApiKey(watchApiKey);
      }
    }, 500); // Debounce validation by 500ms
    
    return () => clearTimeout(handler);
  }, [watchApiKey]);

  async function fetchModelList() {
    try {
      setIsRefreshing(true);
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  }

  async function fetchServerSettings() {
    try {
      setIsLoadingServerSettings(true);
      const response = await fetch('/api/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch server settings');
      }
      const settings = await response.json();
      
      // Update form values with server settings
      if (settings.apiKey) {
        form.setValue('apiKey', settings.apiKey);
      }
      if (settings.apiProxy) {
        form.setValue('apiProxy', settings.apiProxy);
      }
      if (settings.accessPassword) {
        form.setValue('accessPassword', settings.accessPassword);
      }
      
      // Also update the store
      const { update } = useSettingStore.getState();
      update({
        apiKey: settings.apiKey || '',
        apiProxy: settings.apiProxy || '',
        accessPassword: settings.accessPassword || '',
      });
      
    } catch (error) {
      console.error('Error fetching server settings:', error);
    } finally {
      setIsLoadingServerSettings(false);
    }
  }

  useLayoutEffect(() => {
    if (open) {
      refresh();
      fetchServerSettings();
      
      // Check if we need to validate existing API key
      const currentApiKey = useSettingStore.getState().apiKey;
      if (currentApiKey) {
        validateApiKey(currentApiKey);
      }
    }
  }, [open, refresh]);

  // Wait for form to be ready before rendering
  if (!formReady && open) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="sr-only">Loading Settings</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading settings...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("setting.title")}</DialogTitle>
          <DialogDescription>{t("setting.description")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4">
            <Tabs defaultValue="local">
              <TabsList
                className={cn("w-full mb-1", {
                  hidden: BUILD_MODE === "export",
                })}
              >
                <TabsTrigger className="w-1/3" value="local">
                  {t("setting.local")}
                </TabsTrigger>
                <TabsTrigger className="w-1/3" value="server">
                  {t("setting.server")}
                </TabsTrigger>
                <TabsTrigger className="w-1/3" value="usage">
                  API Limits
                </TabsTrigger>
              </TabsList>
              <TabsContent className="space-y-4" value="local">
                <FormField
                  control={form.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem className="from-item">
                      <FormLabel className="col-span-1">
                        {t("setting.apiKeyLabel")}
                        <span className="ml-1 text-red-500">*</span>
                      </FormLabel>
                      <div className="flex gap-2 items-center">
                        <FormControl className="flex-1">
                          <Input
                            type="password"
                            placeholder={t("setting.apiKeyPlaceholder")}
                            {...field}
                          />
                        </FormControl>
                        {apiKeyValidation.status === 'validating' && (
                          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                        )}
                        {apiKeyValidation.status === 'valid' && (
                          <Check className="h-5 w-5 text-green-500" />
                        )}
                        {apiKeyValidation.status === 'invalid' && (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      {apiKeyValidation.status === 'valid' && (
                        <Alert variant="success" className="mt-2 bg-green-50 text-green-700 border-green-200">
                          <AlertDescription className="text-xs">
                            {apiKeyValidation.message}
                          </AlertDescription>
                        </Alert>
                      )}
                      {apiKeyValidation.status === 'invalid' && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertDescription className="text-xs">
                            {apiKeyValidation.message}
                          </AlertDescription>
                        </Alert>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="apiProxy"
                  render={({ field }) => (
                    <FormItem className="from-item">
                      <FormLabel className="col-span-1">
                        {t("setting.apiUrlLabel")}
                      </FormLabel>
                      <FormControl className="col-span-3">
                        <Input
                          placeholder="https://generativelanguage.googleapis.com"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>
              <TabsContent className="space-y-4" value="server">
                <FormField
                  control={form.control}
                  name="accessPassword"
                  render={({ field }) => (
                    <FormItem className="from-item">
                      <FormLabel className="col-span-1">
                        {t("setting.accessPassword")}
                        <span className="ml-1 text-red-500">*</span>
                      </FormLabel>
                      <FormControl className="col-span-3">
                        <Input
                          type="password"
                          placeholder={t("setting.accessPasswordPlaceholder")}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>
              <TabsContent className="space-y-4" value="usage">
                <div className="p-1">
                  <ApiUsageStats />
                  <div className="mt-4 text-xs text-muted-foreground">
                    <p className="mb-2">Rate limits are applied per project, not per API key.</p>
                    <p>Limits vary by model (see <a href="https://ai.google.dev/gemini-api/docs/rate-limits" 
                      target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Google AI docs</a>):</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>Gemini 2.5 Pro Exp: 2 RPM, 50 RPD</li>
                      <li>Gemini 2.0 Flash: 15 RPM, 1,500 RPD</li>
                      <li>Gemini 1.5 Pro: 2 RPM, 50 RPD</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <FormField
              control={form.control}
              name="thinkingModel"
              render={({ field }) => (
                <FormItem className="from-item">
                  <FormLabel className="col-span-1">
                    {t("setting.thinkingModel")}
                  </FormLabel>
                  <FormControl>
                    <div className="col-span-3 flex gap-1">
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          className={cn({ hidden: modelList.length === 0 })}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-sm:max-h-72">
                          {modelList.map((name) => {
                            return (
                              <SelectItem key={name} value={name}>
                                {convertModelName(name)}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <Button
                        className={cn("w-full", {
                          hidden: modelList.length > 0,
                        })}
                        type="button"
                        variant="outline"
                        onClick={() => fetchModelList()}
                      >
                        <RefreshCw
                          className={isRefreshing ? "animate-spin" : ""}
                        />{" "}
                        {t("setting.refresh")}
                      </Button>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="networkingModel"
              render={({ field }) => (
                <FormItem className="from-item">
                  <FormLabel className="col-span-1">
                    {t("setting.networkingModel")}
                  </FormLabel>
                  <FormControl>
                    <div className="col-span-3 flex gap-1">
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          className={cn({ hidden: modelList.length === 0 })}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-sm:max-h-72">
                          {modelList.map((name) => {
                            return (
                              <SelectItem key={name} value={name}>
                                {convertModelName(name)}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <Button
                        className={cn("w-full", {
                          hidden: modelList.length > 0,
                        })}
                        type="button"
                        variant="outline"
                        onClick={() => fetchModelList()}
                      >
                        <RefreshCw
                          className={isRefreshing ? "animate-spin" : ""}
                        />{" "}
                        {t("setting.refresh")}
                      </Button>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem className="from-item">
                  <FormLabel className="col-span-1">
                    {t("setting.language")}
                  </FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-sm:max-h-48">
                        <SelectItem value="en-US">English</SelectItem>
                        <SelectItem value="zh-CN">简体中文</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter className="mt-2 flex-row sm:justify-between sm:space-x-0 gap-3">
          <Button className="flex-1" variant="outline" onClick={onClose}>
            {t("setting.cancel")}
          </Button>
          <Button
            className="flex-1"
            type="submit"
            onClick={form.handleSubmit(handleSubmit)}
          >
            {t("setting.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default Setting;
