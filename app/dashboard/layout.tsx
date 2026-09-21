"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { ThemeToggle } from "@/components/ThemeToggle";

interface NavItem {
  label: string;
  href: string;
  icon: (active: boolean) => React.ReactNode;
  badge?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ full_name: string | null; role: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      if (data.user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", data.user.id)
          .single();
        if (prof) setProfile(prof);
      }
    }

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  }

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: (active) => (
        <svg
          className={`h-5 w-5 transition-colors ${
            active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      ),
    },
    {
      label: "Golf Scores",
      href: "/dashboard/scores",
      icon: (active) => (
        <svg
          className={`h-5 w-5 transition-colors ${
            active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"
          />
          <line x1="4" y1="22" x2="4" y2="15" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: "Charity",
      href: "/dashboard/charity",
      icon: (active) => (
        <svg
          className={`h-5 w-5 transition-colors ${
            active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      ),
    },
    {
      label: "Subscription",
      href: "/dashboard/subscription",
      icon: (active) => (
        <svg
          className={`h-5 w-5 transition-colors ${
            active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
    },
    {
      label: "Monthly Draw",
      href: "/dashboard/draw",
      icon: (active) => (
        <svg
          className={`h-5 w-5 transition-colors ${
            active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      ),
      badge: "Active",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-[#070b12] dark:text-slate-100">
      {/* ============================================================== */}
      {/* DESKTOP SIDEBAR                                                */}
      {/* ============================================================== */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col justify-between border-r border-slate-200/90 bg-white/95 backdrop-blur-xl p-5 md:flex dark:border-slate-800/80 dark:bg-[#0b101b]/95 shadow-sm">
        {/* Top: Logo & Portal Tag */}
        <div>
          <Link href="/dashboard" className="flex items-center space-x-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white shadow-xs transition group-hover:scale-105 group-hover:bg-emerald-600 dark:bg-emerald-500 dark:text-slate-950">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
              </svg>
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-950 dark:text-white">
                Digital <span className="font-serif italic font-normal text-emerald-600 dark:text-emerald-400">Heroes</span>
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Member Portal
              </span>
            </div>
          </Link>

          {/* Nav Items */}
          <nav className="mt-8 space-y-1.5">
            {navItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-emerald-50 text-emerald-950 shadow-xs dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900/80 dark:hover:text-white"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {item.icon(isActive || false)}
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: User Info, Theme Toggle, Public Link & Logout */}
        <div className="space-y-3 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
          {/* User Status Chip */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {user?.email?.charAt(0).toUpperCase() || "U"}
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                    {profile?.full_name || user?.email?.split("@")[0] || "Golfer"}
                  </p>
                  <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    {profile?.role || "Golfer"}
                  </span>
                </div>
                <p className="truncate text-[10px] text-slate-400 dark:text-slate-500">
                  {user?.email || "Signed in"}
                </p>
              </div>
            </div>

            <ThemeToggle />
          </div>

          {/* Links & Logout */}
          <div className="space-y-1">
            <Link
              href="/"
              className="flex items-center space-x-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Public Site</span>
            </Link>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40 cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center space-x-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>{loggingOut ? "Signing out..." : "Log out"}</span>
              </div>
              <span className="text-[10px] text-red-400 dark:text-red-500">Exit</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* MOBILE STICKY HEADER & DRAWER                                  */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200/90 bg-white/95 px-4 backdrop-blur-md md:hidden dark:border-slate-800/80 dark:bg-[#080c14]/95">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-emerald-500 dark:text-slate-950">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
          </div>
          <span className="text-base font-bold text-slate-950 dark:text-white">
            Digital <span className="text-emerald-600 dark:text-emerald-400">Heroes</span>
          </span>
        </Link>

        <div className="flex items-center space-x-2">
          <ThemeToggle />

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
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
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white/95 px-4 pt-3 pb-6 shadow-xl backdrop-blur-xl md:hidden dark:border-slate-800 dark:bg-[#080c14]/95 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-1.5">
            {navItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-emerald-50 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-300 font-semibold"
                      : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {item.icon(isActive || false)}
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-xl px-4 py-2.5 text-center text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900"
            >
              ← Back to Public Website
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
              <span>{loggingOut ? "Signing out..." : "Log out of Digital Heroes"}</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MAIN CONTENT AREA                                              */}
      {/* ============================================================== */}
      <main className="md:ml-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
