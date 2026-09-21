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

type Subscription = {
  status: string;
  plan_type: string;
  current_period_end: string | null;
};

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [charity, setCharity] = useState<Charity | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [scoreCount, setScoreCount] = useState(0);
  const [latestScore, setLatestScore] = useState<number | null>(null);
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

      // 1. Fetch profile with charity info
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

      // 2. Fetch live subscription status
      const { data: subscriptionData } = await supabase
        .from("subscriptions")
        .select("status, plan_type, current_period_end")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setSubscription(subscriptionData);

      // 3. Fetch user's latest 5 scores
      const { data: scoreData } = await supabase
        .from("scores")
        .select("score, score_date")
        .eq("user_id", user.id)
        .order("score_date", { ascending: false })
        .limit(5);

      setScoreCount(scoreData?.length || 0);
      setLatestScore(scoreData?.[0]?.score ?? null);

      setLoading(false);
    }

    loadDashboardData();
  }, [router, supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

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

  const isActive = subscription?.status === "active";

  return (
    <main className="min-h-full p-4 sm:p-6 lg:p-8">
      {/* 45.3 Dashboard Navigation Bar */}
      <div className="mx-auto mb-6 max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard"
              className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
            >
              Dashboard
            </Link>

            <Link
              href="/dashboard/scores"
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Scores
            </Link>

            <Link
              href="/dashboard/charity"
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Charity
            </Link>

            <Link
              href="/dashboard/subscription"
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Subscription
            </Link>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500 cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-6">
        {/* Profile Header Card */}
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

        {/* Stats Grid - 5 Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Card 1: Subscription (LIVE FROM SUPABASE) */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Subscription
              </p>
              {isActive && (
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>

            <h2
              className={`mt-2 text-xl font-bold capitalize ${
                isActive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-gray-900 dark:text-white"
              }`}
            >
              {subscription?.status || "Inactive"}
            </h2>

            {subscription?.plan_type ? (
              <p className="mt-1 text-xs font-medium capitalize text-gray-600 dark:text-gray-300">
                {subscription.plan_type} plan
              </p>
            ) : (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                Pick a plan to enter draws
              </p>
            )}

            {subscription?.current_period_end ? (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Renewal:{" "}
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            ) : (
              <Link
                href="/dashboard/subscription"
                className="mt-2 inline-block text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
              >
                Choose plan &rarr;
              </Link>
            )}
          </div>

          {/* Card 2: Charity */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              My Charity
            </p>
            <h2
              className="mt-2 text-xl font-bold text-gray-900 dark:text-white truncate"
              title={charity?.name || "Not selected"}
            >
              {charity?.name || "Not selected"}
            </h2>
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
              Contribution: {profile?.charity_percentage || 10}%
            </p>
            <Link
              href="/dashboard/charity"
              className="mt-2 inline-block text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
            >
              Change &rarr;
            </Link>
          </div>

          {/* Card 3: Golf Scores */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Golf Scores
            </p>
            <h2 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
              {scoreCount} / 5
            </h2>
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {latestScore !== null
                ? `Latest score: ${latestScore}`
                : "No scores yet"}
            </p>
            <Link
              href="/dashboard/scores"
              className="mt-2 inline-block text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
            >
              Manage scores &rarr;
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
