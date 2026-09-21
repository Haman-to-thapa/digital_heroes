"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Subscriber {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  plan_type: "monthly" | "yearly";
  status: "active" | "past_due" | "lapsed" | "inactive" | "canceled";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
}

interface Stats {
  totalSubscribers: number;
  activeSubscribers: number;
  monthlySubscribers: number;
  yearlySubscribers: number;
  prizePoolGenerated: number;
  prizePoolPerSub: number;
}

export default function AdminSubscriptionsPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  async function loadSubscribers() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/subscriptions");
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to load subscribers.");
        return;
      }

      setSubscribers(data.subscribers || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error(err);
      setError("Network error while loading subscribers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubscribers();
  }, []);

  const filteredSubscribers = subscribers.filter((sub) => {
    const matchesSearch =
      sub.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.stripe_subscription_id &&
        sub.stripe_subscription_id.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ? true : sub.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 text-slate-900 dark:bg-[#070b12] dark:text-slate-100">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header & Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-6 dark:border-slate-800/80">
          <div>
            <div className="flex items-center space-x-2">
              <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                👑 Admin Control Center
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Subscriber Management
              </span>
            </div>

            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              Platform Subscribers Audit 💳
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Live monitor of all enrolled members, active recurring cycles, and monthly sweepstakes prize pool funding.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={loadSubscribers}
              disabled={loading}
              className="inline-flex items-center space-x-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer disabled:opacity-50"
            >
              <svg className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{loading ? "Refreshing..." : "Refresh Data"}</span>
            </button>

            <Link
              href="/admin/draw"
              className="inline-flex items-center space-x-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              <span>Admin Draw Control</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Stats Metrics Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Active Subscribers */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Active Subscribers
              </span>
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {stats?.activeSubscribers ?? 0}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Out of {stats?.totalSubscribers ?? 0} total enrolled
            </p>
          </div>

          {/* Card 2: Prize Pool Generated */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pool Funding (₹)
              </span>
              <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                ₹{stats?.prizePoolPerSub || 100}/sub
              </span>
            </div>
            <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
              ₹{(stats?.prizePoolGenerated ?? 0).toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              Contributed to monthly sweepstakes pool
            </p>
          </div>

          {/* Card 3: Monthly vs Yearly */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Plan Distribution
            </span>
            <div className="mt-2 flex items-baseline space-x-3">
              <div>
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {stats?.monthlySubscribers ?? 0}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">Monthly</span>
              </div>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <div>
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {stats?.yearlySubscribers ?? 0}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">Annual</span>
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Recurring billing breakdown
            </p>
          </div>

          {/* Card 4: Platform Access */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-50/50 p-5 shadow-xs dark:border-amber-500/30 dark:bg-amber-950/20">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              Your Admin Status
            </span>
            <p className="mt-2 text-xl font-black text-amber-900 dark:text-amber-200">
              Bypass Active 👑
            </p>
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400 font-medium">
              Admin accounts have full platform access
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="relative flex-1 min-w-[240px]">
            <svg
              className="absolute left-3.5 top-3 h-4 w-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by user email, name, or subscription ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Status:</span>
            <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              {["all", "active", "canceled", "inactive"].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                    statusFilter === status
                      ? "bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Subscribers Data Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Plan & Billing</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Current Period</th>
                  <th className="px-6 py-4">Days Remaining</th>
                  <th className="px-6 py-4">Stripe Reference</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                        <span className="font-medium">Loading platform subscribers...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredSubscribers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      <div className="space-y-1">
                        <p className="text-base font-bold text-slate-700 dark:text-slate-300">
                          No subscribers found
                        </p>
                        <p className="text-xs">
                          {searchQuery || statusFilter !== "all"
                            ? "Try changing your search query or status filter."
                            : "When users complete Stripe checkout, active subscriptions will appear here automatically."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSubscribers.map((sub) => {
                    const endDate = sub.current_period_end ? new Date(sub.current_period_end) : null;
                    const startDate = sub.current_period_start ? new Date(sub.current_period_start) : null;
                    const daysLeft = endDate
                      ? Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                      : null;

                    return (
                      <tr
                        key={sub.id}
                        className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                      >
                        {/* User Details */}
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              {sub.user_email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-bold text-slate-900 dark:text-white">
                                  {sub.user_name}
                                </p>
                                {sub.user_role === "admin" && (
                                  <span className="rounded-md bg-amber-500/10 px-1.5 py-0.2 text-[9px] font-bold text-amber-700 dark:text-amber-300">
                                    Admin
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {sub.user_email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Plan & Cycle */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${
                                sub.plan_type === "yearly"
                                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              }`}
                            >
                              {sub.plan_type} Plan
                            </span>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {sub.plan_type === "yearly" ? "Annual (12 Mos)" : "Monthly (30 Days)"}
                            </p>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${
                              sub.status === "active"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                                : sub.status === "past_due"
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                                : "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                sub.status === "active"
                                  ? "bg-emerald-500 animate-pulse"
                                  : sub.status === "past_due"
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                              }`}
                            />
                            {sub.status}
                          </span>
                        </td>

                        {/* Current Period (Start - End) */}
                        <td className="px-6 py-4">
                          <div className="text-xs space-y-0.5">
                            <p className="text-slate-700 dark:text-slate-300">
                              Start:{" "}
                              <span className="font-medium">
                                {startDate ? startDate.toLocaleDateString("en-GB") : "—"}
                              </span>
                            </p>
                            <p className="text-slate-900 dark:text-white font-semibold">
                              Renewal:{" "}
                              <span>
                                {endDate ? endDate.toLocaleDateString("en-GB") : "Continuous"}
                              </span>
                            </p>
                          </div>
                        </td>

                        {/* Days Remaining */}
                        <td className="px-6 py-4">
                          {daysLeft !== null ? (
                            <span className="inline-flex items-center space-x-1 font-bold text-emerald-600 dark:text-emerald-400">
                              <span>{daysLeft}</span>
                              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                                days left
                              </span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>

                        {/* Stripe Subscription ID */}
                        <td className="px-6 py-4">
                          <div className="max-w-[160px] truncate text-xs font-mono text-slate-500 dark:text-slate-400">
                            {sub.stripe_subscription_id || "Manual"}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
