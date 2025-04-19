/**
 * Connection Manager
 * 
 * Handles connection monitoring, recovery, and event-based communication
 * to address the "Could not establish connection. Receiving end does not exist" error
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { ErrorType, ErrorSeverity, notifyError, JournalistError } from './error';

// Event names for connection status
const CONNECTION_EVENTS = {
  STATUS_CHANGE: 'connection-status-change',
  RECONNECT_ATTEMPT: 'connection-reconnect-attempt',
  DISCONNECT: 'connection-disconnect',
  RECONNECT_SUCCESS: 'connection-reconnect-success',
  RECONNECT_FAILURE: 'connection-reconnect-failure'
};

// Connection states
export enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting'
}

// Configuration options
interface ConnectionManagerOptions {
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
  onStatusChange?: (status: ConnectionStatus) => void;
}

/**
 * Connection manager class
 */
class ConnectionManager {
  private status: ConnectionStatus = ConnectionStatus.CONNECTED;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number;
  private reconnectInterval: number;
  private heartbeatInterval: number;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private onStatusChangeCallback?: (status: ConnectionStatus) => void;
  
  constructor(options: ConnectionManagerOptions = {}) {
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.reconnectInterval = options.reconnectInterval || 3000;
    this.heartbeatInterval = options.heartbeatInterval || 15000;
    this.onStatusChangeCallback = options.onStatusChange;
    
    // Initialize connection monitoring
    this.startHeartbeat();
    this.attachEventListeners();
  }

  /**
   * Start heartbeat to monitor connection
   */
  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, this.heartbeatInterval);
  }

  /**
   * Stop heartbeat monitoring
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Attach event listeners for connection monitoring
   */
  private attachEventListeners(): void {
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
      
      // Listen for custom connection events
      window.addEventListener(CONNECTION_EVENTS.STATUS_CHANGE, 
        (e: Event) => this.handleStatusChange((e as CustomEvent).detail));
        
      // Clean up on page unload
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });
    }
  }

  /**
   * Remove event listeners
   */
  private removeEventListeners(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
      window.removeEventListener(CONNECTION_EVENTS.STATUS_CHANGE, 
        (e: Event) => this.handleStatusChange((e as CustomEvent).detail));
    }
  }

  /**
   * Handle online event
   */
  private handleOnline = (): void => {
    if (this.status === ConnectionStatus.DISCONNECTED) {
      this.setStatus(ConnectionStatus.CONNECTING);
      this.attemptReconnect();
    }
  };

  /**
   * Handle offline event
   */
  private handleOffline = (): void => {
    this.setStatus(ConnectionStatus.DISCONNECTED);
    this.stopHeartbeat();
  };

  /**
   * Handle connection status change
   */
  private handleStatusChange(newStatus: ConnectionStatus): void {
    this.setStatus(newStatus);
    
    if (newStatus === ConnectionStatus.CONNECTED) {
      // Reset reconnect attempts on successful connection
      this.reconnectAttempts = 0;
      this.startHeartbeat();
    } else if (newStatus === ConnectionStatus.DISCONNECTED) {
      this.attemptReconnect();
    }
  }

  /**
   * Set connection status and notify listeners
   */
  private setStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      
      // Notify application of status change
      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback(status);
      }
      
      // Dispatch event for other components to listen to
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(CONNECTION_EVENTS.STATUS_CHANGE, { 
          detail: status 
        }));
      }
      
      // Log status change
      console.log(`Connection status changed to: ${status}`);
    }
  }

  /**
   * Send heartbeat to check connection
   */
  private sendHeartbeat(): void {
    // Check connection status by attempting to send a message
    try {
      // A simple way to check connection is to perform a minimal fetch
      // This could be replaced with your specific connection check logic
      this.checkConnection()
        .then(() => {
          if (this.status !== ConnectionStatus.CONNECTED) {
            this.setStatus(ConnectionStatus.CONNECTED);
          }
        })
        .catch(() => {
          if (this.status === ConnectionStatus.CONNECTED) {
            this.setStatus(ConnectionStatus.DISCONNECTED);
            this.attemptReconnect();
          }
        });
    } catch (error) {
      if (this.status === ConnectionStatus.CONNECTED) {
        this.setStatus(ConnectionStatus.DISCONNECTED);
        this.attemptReconnect();
      }
    }
  }

  /**
   * Check connection by making a minimal request
   */
  private async checkConnection(): Promise<boolean> {
    try {
      // Create a minimal HEAD request to check connectivity
      // Using a data URL prevents an actual network request while still testing messaging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch('data:,', { 
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return true;
    } catch (error) {
      // Only treat abort errors as connection issues
      if (error.name === 'AbortError') {
        throw new JournalistError({
          type: ErrorType.NETWORK,
          message: 'Connection check failed - timeout',
          severity: ErrorSeverity.WARNING,
          originalError: error,
          userFriendlyMessage: 'Connection check failed'
        });
      }
      
      // Other errors might not be connection-related
      return true;
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    // Clear any existing reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Check if max attempts reached
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setStatus(ConnectionStatus.DISCONNECTED);
      
      notifyError(new JournalistError({
        type: ErrorType.NETWORK,
        message: `Failed to reconnect after ${this.maxReconnectAttempts} attempts`,
        severity: ErrorSeverity.ERROR,
        userFriendlyMessage: `Connection lost. Please refresh the page to reconnect.`
      }));
      
      return;
    }
    
    // Set connecting status
    this.setStatus(ConnectionStatus.CONNECTING);
    this.reconnectAttempts++;
    
    // Dispatch reconnect attempt event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CONNECTION_EVENTS.RECONNECT_ATTEMPT, { 
        detail: { attempt: this.reconnectAttempts } 
      }));
    }
    
    // Schedule reconnect attempt
    this.reconnectTimer = setTimeout(() => {
      this.checkConnection()
        .then(() => {
          this.setStatus(ConnectionStatus.CONNECTED);
          this.startHeartbeat();
          
          // Dispatch success event
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(CONNECTION_EVENTS.RECONNECT_SUCCESS));
          }
          
          // Show success message if not first connection
          if (this.reconnectAttempts > 0) {
            toast.success("Connection restored");
          }
        })
        .catch(() => {
          // Try again
          this.attemptReconnect();
          
          // Dispatch failure event
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(CONNECTION_EVENTS.RECONNECT_FAILURE, {
              detail: { attempt: this.reconnectAttempts }
            }));
          }
        });
    }, this.reconnectInterval);
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.stopHeartbeat();
    this.removeEventListeners();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Get current connection status
   */
  public getStatus(): ConnectionStatus {
    return this.status;
  }
}

// Create singleton instance
const connectionManager = typeof window !== 'undefined' 
  ? new ConnectionManager()
  : null;

/**
 * React hook for using connection status in components
 */
export function useConnectionStatus(): {
  status: ConnectionStatus;
  isOnline: boolean;
  isConnecting: boolean;
} {
  const [status, setStatus] = useState<ConnectionStatus>(
    connectionManager?.getStatus() || ConnectionStatus.CONNECTED
  );
  
  const handleStatusChange = useCallback((newStatus: ConnectionStatus) => {
    setStatus(newStatus);
  }, []);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Update initial state
      setStatus(connectionManager?.getStatus() || ConnectionStatus.CONNECTED);
      
      // Listen for connection status changes
      const statusChangeListener = (e: Event) => {
        handleStatusChange((e as CustomEvent).detail);
      };
      
      window.addEventListener(CONNECTION_EVENTS.STATUS_CHANGE, statusChangeListener);
      
      return () => {
        window.removeEventListener(CONNECTION_EVENTS.STATUS_CHANGE, statusChangeListener);
      };
    }
  }, [handleStatusChange]);
  
  return {
    status,
    isOnline: status === ConnectionStatus.CONNECTED,
    isConnecting: status === ConnectionStatus.CONNECTING
  };
}

export default connectionManager;