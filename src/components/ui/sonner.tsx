"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
    return (
        <Sonner
            position="top-right"
            expand={true}
            richColors
            closeButton
            duration={4000}
            visibleToasts={5}
            toastOptions={{
                style: {
                    background: 'var(--background)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                },
                className: 'toast-with-progress',
            }}
            {...props}
        />
    )
}

export { Toaster }
