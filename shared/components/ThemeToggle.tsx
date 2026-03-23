"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-full justify-start px-3 py-3.5 h-auto text-slate-500">
        <div className="h-5 w-5" />
      </Button>
    )
  }

  const isDark = theme === "dark" || resolvedTheme === "dark"

  return (
    <Button
      variant="ghost"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-full justify-start px-3 py-3.5 h-auto rounded-xl gap-3 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
    >
      <div className="relative h-5 w-5 flex items-center justify-center shrink-0">
        <Sun className="absolute h-5 w-5 transition-all duration-300 dark:-rotate-90 dark:opacity-0 opacity-100 rotate-0" />
        <Moon className="absolute h-5 w-5 transition-all duration-300 dark:rotate-0 dark:opacity-100 opacity-0 rotate-90 text-white" />
      </div>
      <span className="font-bold text-sm tracking-wide">
        {isDark ? 'Light Mode' : 'Dark Mode'}
      </span>
    </Button>
  )
}
