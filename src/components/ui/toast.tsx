import * as React from 'react'
import * as RadixToast from '@radix-ui/react-toast'
import { cn } from '@/lib/utils'

type ToastVariant = 'default' | 'destructive' | 'success'

export type ToastOptions = {
  title?: string
  description?: string
  variant?: ToastVariant
  durationMs?: number
}

type ToastContextValue = {
  addToast: (opts: ToastOptions) => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

type InternalToast = ToastOptions & { id: string; open: boolean }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<InternalToast[]>([])

  const addToast = React.useCallback((opts: ToastOptions) => {
    const id = Math.random().toString(36).slice(2)
    setItems((prev) => [...prev, { id, open: true, ...opts }])
  }, [])

  const onOpenChange = (id: string, open: boolean) => {
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, open } : t)))
    if (!open) {
      setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 250)
    }
  }

  return (
    <ToastContext.Provider value={{ addToast }}>
      <RadixToast.Provider swipeDirection="right">
        {children}
        <div className="fixed bottom-4 right-4 z-50 flex w-[92vw] max-w-sm flex-col gap-2 sm:w-[420px]">
          {items.map(({ id, title, description, variant = 'default', durationMs = 4000, open }) => (
            <RadixToast.Root
              key={id}
              duration={durationMs}
              open={open}
              onOpenChange={(o) => onOpenChange(id, o)}
              className={cn(
                'group pointer-events-auto relative w-full rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md',
                'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-bottom-2 data-[state=closed]:slide-out-to-right-2',
                variant === 'destructive'
                  ? 'border-destructive/40 bg-destructive/10 text-destructive'
                  : variant === 'success'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'border-foreground/15 bg-background/70 text-foreground',
              )}
            >
              {title && <RadixToast.Title className="text-sm font-semibold">{title}</RadixToast.Title>}
              {description && <RadixToast.Description className="mt-1 text-sm opacity-90">{description}</RadixToast.Description>}
              <RadixToast.Close className="absolute right-2 top-2 rounded-md px-2 py-1 text-xs opacity-70 transition hover:opacity-100">Fermer</RadixToast.Close>
            </RadixToast.Root>
          ))}
        </div>
        <RadixToast.Viewport className="pointer-events-none fixed bottom-0 right-0 z-[100] m-0 flex max-h-screen w-full flex-col-reverse gap-2 p-4 outline-none sm:max-w-[420px]" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}


