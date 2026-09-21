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

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/80 bg-white/80 backdrop-blur-md transition-colors dark:border-gray-800/80 dark:bg-gray-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 font-bold text-white shadow-md">
            ⛳
          </div>
          <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
            Digital <span className="text-emerald-600 dark:text-emerald-400">Heroes</span>
          </span>
        </Link>

        <nav className="flex items-center space-x-1 sm:space-x-3">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  pathname === "/dashboard"
                    ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/scores"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  pathname === "/dashboard/scores"
                    ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                Scores
              </Link>
              <Link
                href="/charities"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  pathname === "/charities"
                    ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                Charities
              </Link>
              <Link
                href="/dashboard/subscription"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  pathname === "/dashboard/subscription"
                    ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                Subscription
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/charities"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  pathname === "/charities"
                    ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                Charities
              </Link>
              <Link
                href="/login"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  pathname === "/login"
                    ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-black px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                Sign up
              </Link>
            </>
          )}

          <div className="pl-2">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
