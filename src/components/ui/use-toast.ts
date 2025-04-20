import * as React from "react"
import { toast as sonnerToast, type Toast as SonnerToast } from "sonner"

type ToasterToast = SonnerToast & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  type?: "success" | "error" | "default" | "warning" | "info"
}

let count = 0

function generateId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type ToastProps = Omit<ToasterToast, "id">

function toast(props: ToastProps) {
  const id = generateId()

  const toastType = props.type || "default"
  sonnerToast[toastType](props.title, {
    id,
    description: props.description,
    action: props.action,
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

function useToast() {
  return {
    toast,
    dismiss: (toastId?: string) => {
      if (toastId) {
        sonnerToast.dismiss(toastId)
      } else {
        sonnerToast.dismiss()
      }
    }
  }
}

export { toast, useToast }