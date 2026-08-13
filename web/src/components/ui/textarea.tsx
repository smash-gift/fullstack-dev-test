import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Textarea nativa — não há primitive de textarea no @base-ui/react instalado neste projeto (diferente
 * de Input, que usa @base-ui/react/input). Estilo alinhado a input.tsx: mesma borda, radius, cores de
 * foco/erro/disabled dos tokens (color.border.*, radius.small).
 */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-24 w-full resize-y rounded-sm border border-input bg-transparent px-4 py-3 text-base font-body transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
