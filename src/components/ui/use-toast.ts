import * as React from "react"
import { toast as sonnerToast, type Toast as SonnerToast } from "sonner"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = SonnerToast & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  type?: "success" | "error" | "default" | "warning" | "info"
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function generateId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    // dispatch({
    //   type: "REMOVE_TOAST",
    //   toastId: toastId,
    // })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type ToastProps = Omit<ToasterToast, "id">

function toast(props: ToastProps) {
  const id = generateId()

  // Sonner toast
  const toastType = props.type || "default"
  sonnerToast[toastType](props.title, {
    id,
    description: props.description,
    action: props.action,
    // Map other relevant properties
  })

  return id
}

toast.success = (props: ToastProps) => {
  return toast({ ...props, type: "success" })
}

toast.error = (props: ToastProps) => {
  return toast({ ...props, type: "error" })
}

toast.warning = (props: ToastProps) => {
  return toast({ ...props, type: "warning" })
}

toast.info = (props: ToastProps) => {
  return toast({ ...props, type: "info" })
}

// Hook for usage in components
function useToast() {
  return {
    toast,
    dismiss: (toastId?: string) => {
      // Using sonner's dismiss functionality
      if (toastId) {
        sonnerToast.dismiss(toastId)
      } else {
        sonnerToast.dismiss()
      }
    }
  }
}

export { toast, useToast } 