import { Toaster as Sonner } from "sonner"

const Toaster = () => {
  return (
    <Sonner
      theme="system"
      position="top-right"
      richColors
      closeButton
      className="toaster group"
    />
  )
}

export { Toaster }
