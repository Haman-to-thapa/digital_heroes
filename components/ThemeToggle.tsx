"use client";

import { useEffect, useState } from "react";

interface ThemeToggleProps {
  variant?: "icon" | "segmented" | "labeled";
  className?: string;
}

export function ThemeToggle({ variant = "icon", className = "" }: ThemeToggleProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    if (saved) {
      setTheme(saved);
      if (saved === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }
  }, []);

  function setThemeMode(next: "light" | "dark") {
    setTheme(next);
    localStorage.setItem("theme", next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  function toggleTheme() {
    setThemeMode(theme === "light" ? "dark" : "light");
  }

  if (!mounted) {
    if (variant === "segmented") {
      return (
        <div className={`h-9 w-full rounded-xl bg-slate-100 dark:bg-slate-900 animate-pulse ${className}`} />
      );
    }
    return <div className={`h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-900 ${className}`} />;
  }

  // Segmented 2-button pill variant (most visible)
  if (variant === "segmented") {
    return (
      <div
        className={`flex w-full items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs ${className}`}
        role="group"
        aria-label="Theme selector"
      >
        <button
          type="button"
          onClick={() => setThemeMode("light")}
          className={`flex flex-1 items-center justify-center space-x-1.5 rounded-lg py-1.5 px-2.5 text-xs font-semibold transition-all cursor-pointer ${
            theme === "light"
              ? "bg-white text-amber-600 shadow-xs ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-amber-400"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <svg
            className="h-3.5 w-3.5 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <span>Light</span>
        </button>

        <button
          type="button"
          onClick={() => setThemeMode("dark")}
          className={`flex flex-1 items-center justify-center space-x-1.5 rounded-lg py-1.5 px-2.5 text-xs font-semibold transition-all cursor-pointer ${
            theme === "dark"
              ? "bg-slate-800 text-indigo-300 shadow-xs ring-1 ring-slate-700/80 dark:bg-emerald-950/70 dark:text-emerald-300 dark:ring-emerald-800/60"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <svg
            className="h-3.5 w-3.5 text-indigo-400 dark:text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
          <span>Dark</span>
        </button>
      </div>
    );
  }

  // Labeled button variant
  if (variant === "labeled") {
    return (
      <button
        onClick={toggleTheme}
        type="button"
        className={`inline-flex items-center space-x-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer ${className}`}
        aria-label="Toggle theme"
      >
        {theme === "light" ? (
          <>
            <svg
              className="h-3.5 w-3.5 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <span>Light Mode</span>
          </>
        ) : (
          <>
            <svg
              className="h-3.5 w-3.5 text-indigo-400 dark:text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
            <span>Dark Mode</span>
          </>
        )}
      </button>
    );
  }

  // Default icon button with enhanced visibility & active indicator
  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
      className={`relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300/90 bg-white text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer ${className}`}
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-amber-500 transition transform hover:rotate-45"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-indigo-400 dark:text-emerald-400 transition transform hover:-rotate-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
}
