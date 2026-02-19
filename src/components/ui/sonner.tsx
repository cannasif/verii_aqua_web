import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white/95 group-[.toaster]:dark:bg-[#0c0516]/95 group-[.toaster]:text-foreground group-[.toaster]:border-slate-200 group-[.toaster]:dark:border-white/10 group-[.toaster]:shadow-xl group-[.toaster]:backdrop-blur-xl",
          description: "group-[.toast]:text-slate-500 group-[.toast]:dark:text-slate-400",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error: "group-[.toaster]:text-red-600 group-[.toaster]:dark:text-red-400",
          success: "group-[.toaster]:text-green-600 group-[.toaster]:dark:text-green-400",
          warning: "group-[.toaster]:text-amber-600 group-[.toaster]:dark:text-amber-400",
          info: "group-[.toaster]:text-blue-600 group-[.toaster]:dark:text-blue-400",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-5" />,
        info: <InfoIcon className="size-5" />,
        warning: <TriangleAlertIcon className="size-5" />,
        error: <OctagonXIcon className="size-5" />,
        loading: <Loader2Icon className="size-5 animate-spin" />,
      }}
      {...props}
    />
  )
}

export { Toaster }
