"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border-2 border-slate-400 transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[size=default]:h-[24px] data-[size=default]:w-[44px] data-[size=sm]:h-[16px] data-[size=sm]:w-[28px] data-checked:bg-primary data-unchecked:bg-slate-200 shadow-sm cursor-pointer",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block rounded-full bg-white shadow-md ring-0 transition-transform data-checked:translate-x-[20px] data-unchecked:translate-x-0 group-data-[size=default]/switch:size-5 group-data-[size=sm]/switch:size-3"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
