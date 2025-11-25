import { useEffect, useCallback, useRef } from "react";
import { useGlobalStore } from "@/store/global";
import { useTaskStore } from "@/store/task";
import { useHistoryStore } from "@/store/history";
import { toast } from "sonner";

/**
 * Hook for managing global keyboard shortcuts in Deep Journalist
 *
 * Supported shortcuts:
 * - Ctrl/Cmd + Enter: Start research (when focused on topic input)
 * - Ctrl/Cmd + S: Save/export current article
 * - Ctrl/Cmd + N: New research session
 * - Ctrl/Cmd + H: Open history
 * - Ctrl/Cmd + ,: Open settings
 * - Escape: Cancel current operation / close modals
 */

interface UseKeyboardShortcutsOptions {
  /**
   * Callback when research should be started
   * Typically triggered by form submission
   */
  onStartResearch?: () => void;

  /**
   * Callback when article should be saved/exported
   */
  onSaveArticle?: () => void;

  /**
   * Callback when a new research session should be created
   */
  onNewResearch?: () => void;

  /**
   * Whether keyboard shortcuts are enabled
   * @default true
   */
  enabled?: boolean;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const {
    onStartResearch,
    onSaveArticle,
    onNewResearch,
    enabled = true,
  } = options;

  const globalStore = useGlobalStore();
  const taskStore = useTaskStore();
  const historyStore = useHistoryStore();

  // Track if user is typing in an input/textarea (except for specific shortcuts)
  const isTypingRef = useRef(false);

  // Detect OS for Cmd (Mac) vs Ctrl (Windows/Linux)
  const isMac = typeof window !== 'undefined' &&
    navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  const modifierKey = isMac ? 'Cmd' : 'Ctrl';

  /**
   * Check if the user is currently typing in an input field
   */
  const updateTypingState = useCallback((event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    const isInput =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable;

    isTypingRef.current = isInput;

    return isInput;
  }, []);

  /**
   * Check if the modifier key (Ctrl/Cmd) is pressed
   */
  const hasModifier = useCallback((event: KeyboardEvent) => {
    return isMac ? event.metaKey : event.ctrlKey;
  }, [isMac]);

  /**
   * Handle Escape key - close modals
   */
  const handleEscape = useCallback(() => {
    if (globalStore.openSetting) {
      globalStore.setOpenSetting(false);
      toast.info("Settings closed");
      return true;
    }

    if (globalStore.openHistory) {
      globalStore.setOpenHistory(false);
      toast.info("History closed");
      return true;
    }

    return false;
  }, [globalStore]);

  /**
   * Handle Ctrl/Cmd + H - open history
   */
  const handleOpenHistory = useCallback(() => {
    if (globalStore.openHistory) {
      globalStore.setOpenHistory(false);
      toast.info("History closed");
    } else {
      globalStore.setOpenHistory(true);
      toast.info(`History opened (${modifierKey}+H)`, {
        description: "View your past research sessions"
      });
    }
  }, [globalStore, modifierKey]);

  /**
   * Handle Ctrl/Cmd + , - open settings
   */
  const handleOpenSettings = useCallback(() => {
    if (globalStore.openSetting) {
      globalStore.setOpenSetting(false);
      toast.info("Settings closed");
    } else {
      globalStore.setOpenSetting(true);
      toast.info(`Settings opened (${modifierKey}+,)`, {
        description: "Configure your API keys and preferences"
      });
    }
  }, [globalStore, modifierKey]);

  /**
   * Handle Ctrl/Cmd + N - new research session
   */
  const handleNewResearch = useCallback(() => {
    if (onNewResearch) {
      onNewResearch();
      toast.success(`New research session started (${modifierKey}+N)`);
    } else {
      // Default behavior: reset task store and update history if needed
      const { id, backup, reset } = taskStore;
      const { update } = historyStore;

      if (id) {
        update(id, backup());
      }
      reset();

      toast.success(`New research session started (${modifierKey}+N)`);
    }
  }, [onNewResearch, taskStore, historyStore, modifierKey]);

  /**
   * Handle Ctrl/Cmd + S - save/export article
   */
  const handleSaveArticle = useCallback((event: KeyboardEvent) => {
    event.preventDefault(); // Prevent browser's default save dialog

    if (onSaveArticle) {
      onSaveArticle();
      toast.success(`Article export initiated (${modifierKey}+S)`);
    } else if (taskStore.finalReport) {
      // Default behavior: show info that article is available to export
      toast.info(`Article ready to export (${modifierKey}+S)`, {
        description: "Use the download button in the Final Report section"
      });
    } else {
      toast.error("No article to export", {
        description: "Complete a research session first"
      });
    }
  }, [onSaveArticle, taskStore.finalReport, modifierKey]);

  /**
   * Handle Ctrl/Cmd + Enter - start research
   */
  const handleStartResearch = useCallback((event: KeyboardEvent) => {
    // Only works when typing in an input field
    const target = event.target as HTMLElement;
    const isInput =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA';

    if (!isInput) return;

    if (onStartResearch) {
      event.preventDefault();
      onStartResearch();
      toast.info(`Research started (${modifierKey}+Enter)`);
    }
  }, [onStartResearch, modifierKey]);

  /**
   * Main keyboard event handler
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    updateTypingState(event);
    const isTyping = isTypingRef.current;

    // Escape key - always works
    if (event.key === 'Escape') {
      const handled = handleEscape();
      if (handled) {
        event.preventDefault();
      }
      return;
    }

    // Modifier key shortcuts
    if (hasModifier(event)) {
      switch (event.key.toLowerCase()) {
        case 'h':
          // Ctrl/Cmd + H - open history
          event.preventDefault();
          handleOpenHistory();
          break;

        case ',':
          // Ctrl/Cmd + , - open settings
          event.preventDefault();
          handleOpenSettings();
          break;

        case 'n':
          // Ctrl/Cmd + N - new research (only when not typing)
          if (!isTyping) {
            event.preventDefault();
            handleNewResearch();
          }
          break;

        case 's':
          // Ctrl/Cmd + S - save/export article
          handleSaveArticle(event);
          break;

        case 'enter':
          // Ctrl/Cmd + Enter - start research (only when typing)
          if (isTyping) {
            handleStartResearch(event);
          }
          break;
      }
    }
  }, [
    enabled,
    updateTypingState,
    hasModifier,
    handleEscape,
    handleOpenHistory,
    handleOpenSettings,
    handleNewResearch,
    handleSaveArticle,
    handleStartResearch,
  ]);

  /**
   * Set up global keyboard event listener
   */
  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  return {
    modifierKey,
    shortcuts: {
      startResearch: `${modifierKey}+Enter`,
      saveArticle: `${modifierKey}+S`,
      newResearch: `${modifierKey}+N`,
      openHistory: `${modifierKey}+H`,
      openSettings: `${modifierKey}+,`,
      closeModal: 'Escape',
    },
  };
}
