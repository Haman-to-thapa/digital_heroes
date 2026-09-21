"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await supabase.auth.signOut();
      setMobileMenuOpen(false);
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  // Hide the public navbar on /dashboard and /admin routes since they have their own dedicated sidebar & mobile layout
  if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-xl transition-colors dark:border-slate-800/80 dark:bg-[#080c14]/85">
      {/* Top emerald accent line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white shadow-xs transition group-hover:scale-105 group-hover:bg-emerald-600 dark:bg-emerald-500 dark:text-slate-950">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-950 dark:text-white">
              Digital <span className="font-serif italic font-normal text-emerald-600 dark:text-emerald-400">Heroes</span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-2 sm:space-x-3">
          <Link
            href="/charities"
            className={`rounded-xl px-3.5 py-1.5 text-sm font-medium transition ${
              pathname === "/charities"
                ? "bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-white"
                : "text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            Charities
          </Link>

          <Link
            href="/draws"
            className={`rounded-xl px-3.5 py-1.5 text-sm font-medium transition ${
              pathname === "/draws"
                ? "bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-white"
                : "text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            Draw Results
          </Link>

          {user ? (
            <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-200 dark:border-slate-800">
              {/* User Avatar Chip */}
              <div className="flex items-center space-x-2 rounded-xl bg-slate-100/80 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                  {user.email?.charAt(0).toUpperCase() || "U"}
                </span>
                <span className="max-w-[110px] truncate">{user.email?.split("@")[0]}</span>
              </div>

              {/* Dashboard Button */}
              <Link
                href="/dashboard"
                className="flex items-center space-x-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-xs transition hover:bg-emerald-500"
              >
                <span>Dashboard</span>
                <span className="text-xs">→</span>
              </Link>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                title="Log out"
                className="flex items-center space-x-1.5 rounded-xl border border-red-200/80 bg-red-50/60 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-950/60 dark:bg-red-950/30 dark:text-red-400 cursor-pointer disabled:opacity-50"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>{loggingOut ? "..." : "Logout"}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <Link
                href="/login"
                className={`rounded-xl px-3.5 py-1.5 text-sm font-medium transition ${
                  pathname === "/login"
                    ? "bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-white"
                    : "text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-slate-950 px-4 py-1.5 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
              >
                Join Now
              </Link>
            </div>
          )}

          <div className="pl-1 border-l border-slate-200 dark:border-slate-800">
            <ThemeToggle />
          </div>
        </nav>

        {/* Mobile Right Controls: Theme Toggle + Hamburger */}
        <div className="flex md:hidden items-center space-x-2">
          <ThemeToggle />

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
          >
            {mobileMenuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white/95 px-4 pt-3 pb-6 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-[#080c14]/95 md:hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-2.5">
            <Link
              href="/charities"
              onClick={() => setMobileMenuOpen(false)}
              className={`rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                pathname === "/charities"
                  ? "bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-white"
                  : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
              }`}
            >
              Charity Directory
            </Link>

            <Link
              href="/draws"
              onClick={() => setMobileMenuOpen(false)}
              className={`rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                pathname === "/draws"
                  ? "bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-white"
                  : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
              }`}
            >
              Draw Results
            </Link>

            {user ? (
              <>
                <div className="flex items-center space-x-2.5 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                    {user.email?.charAt(0).toUpperCase() || "U"}
                  </span>
                  <div className="overflow-hidden">
                    <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                      {user.email}
                    </p>
                  </div>
                </div>

                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center space-x-2 rounded-xl bg-emerald-600 py-2.5 text-center text-sm font-semibold text-white shadow-xs transition hover:bg-emerald-500"
                >
                  <span>Go to Member Dashboard</span>
                  <span>→</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex w-full items-center justify-center space-x-2 rounded-xl border border-red-200 bg-red-50/70 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-950/60 dark:bg-red-950/30 dark:text-red-400 cursor-pointer"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>{loggingOut ? "Signing out..." : "Log out"}</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  Member Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl bg-slate-950 py-2.5 text-center text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
                >
                  Join Digital Heroes
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
