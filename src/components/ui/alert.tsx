import * as React from 'react'
import { cn } from '@/lib/utils'

type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'destructive' | 'success' | 'warning'
}

export function Alert({ className, variant = 'default', ...props }: AlertProps) {
  const variantClasses =
    variant === 'destructive'
      ? 'border-destructive/50 text-destructive bg-destructive/10'
      : variant === 'success'
      ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10'
      : variant === 'warning'
      ? 'border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10'
      : 'border-foreground/15 text-foreground bg-foreground/5'

  return (
    <div
      role="alert"
      className={cn(
        'w-full rounded-lg border px-3 py-2 text-sm md:text-[0.9375rem] shadow-sm',
        variantClasses,
        className,
      )}
      {...props}
    />
  )
}


