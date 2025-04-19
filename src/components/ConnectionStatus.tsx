"use client";

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useConnectionStatus, ConnectionStatus } from '@/utils/connection-manager';

export function ConnectionStatusIndicator() {
  const { status, isOnline, isConnecting } = useConnectionStatus();
  const [showAlert, setShowAlert] = useState(false);
  
  // Show alert when connection is lost
  useEffect(() => {
    if (status === ConnectionStatus.DISCONNECTED) {
      setShowAlert(true);
    } else if (status === ConnectionStatus.CONNECTED) {
      // Hide alert after a delay when connection is restored
      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Handle manual refresh
  const handleRefresh = () => {
    window.location.reload();
  };
  
  if (isOnline && !showAlert) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-help">
              <Badge variant="outline" className="bg-green-50 gap-1 text-green-700 hover:bg-green-50 hover:text-green-700">
                <Wifi className="h-3 w-3" />
                <span className="text-xs">Connected</span>
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Connection to server is active</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  if (isConnecting) {
    return (
      <Alert variant="warning" className="mt-2 animate-pulse">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        <AlertTitle>Reconnecting...</AlertTitle>
        <AlertDescription>
          Attempting to restore connection to the server.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (!isOnline || showAlert) {
    return (
      <Alert variant="destructive" className="mt-2">
        <WifiOff className="h-4 w-4 mr-2" />
        <AlertTitle>Connection Lost</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <p>
            Unable to communicate with the server. This may affect application functionality.
          </p>
          <div>
            <Button onClick={handleRefresh} size="sm">
              Refresh Page
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }
  
  return null;
}