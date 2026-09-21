"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Profile = {
  full_name: string | null;
  role: string;
  charity_id: string | null;
  charity_percentage: number;
};

type Charity = {
  name: string;
};

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [charity, setCharity] = useState<Charity | null>(null);
  const [scoresCount, setScoresCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Fetch profile with charity info
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, role, charity_id, charity_percentage")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);

        // Fetch selected charity details
        if (profileData.charity_id) {
          const { data: charityData } = await supabase
            .from("charities")
            .select("name")
            .eq("id", profileData.charity_id)
            .single();

          if (charityData) {
            setCharity(charityData);
          }
        }
      }

      // Fetch scores count
      const { count } = await supabase
        .from("scores")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      setScoresCount(count || 0);
      setLoading(false);
    }

    loadDashboardData();
  }, [router, supabase]);

  if (loading) {
    return (
      <main className="min-h-[80vh] flex items-center justify-center">
        <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 font-medium">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <span>Loading dashboard...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Profile Card */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                Welcome back
              </p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                {profile?.full_name || "User"}
              </h1>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Role: <span className="text-gray-900 dark:text-white">{profile?.role}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/scores"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
              >
                Manage Scores ⛳
              </Link>
              <Link
                href="/dashboard/charity"
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                My Charity 🎗️
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid - 5 Cards including Charity */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Card 1: Subscription */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Subscription
            </p>
            <h2 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
              Inactive
            </h2>
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Pick a plan to enter
            </p>
            <Link
              href="/dashboard/subscription"
              className="mt-1 inline-block text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
            >
              Choose plan &rarr;
            </Link>
          </div>

          {/* Card 2: Charity */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              My Charity
            </p>
            <h2 className="mt-2 text-xl font-bold text-gray-900 dark:text-white truncate" title={charity?.name || "Not selected"}>
              {charity?.name || "Not selected"}
            </h2>
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
              Contribution: {profile?.charity_percentage || 10}%
            </p>
          </div>

          {/* Card 3: Golf Scores */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Golf Scores
            </p>
            <h2 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
              {scoresCount} / 5
            </h2>
            <Link
              href="/dashboard/scores"
              className="mt-1 inline-block text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
            >
              Add / View &rarr;
            </Link>
          </div>

          {/* Card 4: Draws */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Draws
            </p>
            <h2 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
              0
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Monthly sweepstakes
            </p>
          </div>

          {/* Card 5: Total Winnings */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Winnings
            </p>
            <h2 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
              ₹0
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Verified payouts
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
