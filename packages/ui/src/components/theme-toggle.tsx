"use client";

import { useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { cn } from "../utils/cn";

type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

const readStoredTheme = (): Theme | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark") return raw;
    return null;
  } catch {
    return null;
  }
};

const writeStoredTheme = (theme: Theme) => {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Ignore storage write errors (eg. Safari private mode)
  }
};

const getSystemTheme = (): Theme => {
  if (typeof window === "undefined") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const applyTheme = (theme: Theme) => {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
};

export interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const hasExplicitPreferenceRef = useRef(false);
  const [theme, setTheme] = useState<Theme>("light");

  // Initialize from storage/system on mount.
  useEffect(() => {
    const stored = readStoredTheme();
    if (stored) {
      hasExplicitPreferenceRef.current = true;
      setTheme(stored);
      return;
    }
    setTheme(getSystemTheme());
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Follow system theme only if user hasn't explicitly chosen.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hasExplicitPreferenceRef.current) return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? "dark" : "light");
    };

    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    hasExplicitPreferenceRef.current = true;
    setTheme(next);
    if (typeof window !== "undefined") writeStoredTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200/70 bg-white/90 transition hover:border-sky-500 hover:text-sky-500 dark:border-zinc-800/70 dark:bg-zinc-900/70 dark:text-zinc-100",
        className
      )}
    >
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
