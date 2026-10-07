"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle dark mode"
        className="rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-muted"
        disabled
      >
        <span className="opacity-50">◐</span>
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-muted transition"
    >
      {isDark ? <span aria-hidden>☀️</span> : <span aria-hidden>🌙</span>}
    </button>
  );
}
