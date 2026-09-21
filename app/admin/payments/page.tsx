"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Payment {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  plan_type: "monthly" | "yearly";
  amount: number;
  currency: string;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  payment_date: string;
}

interface Metrics {
  totalRevenue: number;
  mrr: number;
  activeSubscriptions: number;
  monthlyCount: number;
  yearlyCount: number;
  totalTransactions: number;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");

  async function loadPayments() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payments");
      const data = await res.json();
      if (res.ok) {
        setPayments(data.payments || []);
        setMetrics(data.metrics || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, []);

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.user_name.toLowerCase().includes(search.toLowerCase()) ||
      p.user_email.toLowerCase().includes(search.toLowerCase()) ||
      (p.stripe_subscription_id &&
        p.stripe_subscription_id.toLowerCase().includes(search.toLowerCase()));

    const matchesPlan = planFilter === "all" ? true : p.plan_type === planFilter;

    return matchesSearch && matchesPlan;
  });

  return (
    <div className="space-y-8">
      {/* Header & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-6 dark:border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2">
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
              👑 Admin Control Center
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Financial Operations
            </span>
          </div>

          <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            Payments & Platform Revenue 💳
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Audit all user transactions, subscription billings, Stripe customer accounts, and revenue collected.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadPayments}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
          >
            <svg className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Data
          </button>
          <Link
            href="/admin"
            className="rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-500 transition"
          >
            ← Command Center
          </Link>
        </div>
      </div>

        {/* 4 Financial KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Total Revenue */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-[#0b101b]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Revenue
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 text-sm">
                💰
              </span>
            </div>
            <p className="mt-3 text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              ₹{metrics ? metrics.totalRevenue.toLocaleString("en-IN") : "0"}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Across {metrics?.totalTransactions || 0} total transactions
            </p>
          </div>

          {/* Card 2: Estimated MRR */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-[#0b101b]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Monthly Recurring (MRR)
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 text-sm">
                📈
              </span>
            </div>
            <p className="mt-3 text-3xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">
              ₹{metrics ? metrics.mrr.toLocaleString("en-IN") : "0"}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Recurring recurring baseline
            </p>
          </div>

          {/* Card 3: Active Subscriptions */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-[#0b101b]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Active Paying Members
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 text-sm">
                👥
              </span>
            </div>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              {metrics ? metrics.activeSubscriptions : 0}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {metrics?.monthlyCount || 0} Monthly • {metrics?.yearlyCount || 0} Yearly
            </p>
          </div>

          {/* Card 4: Plan Distribution */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-[#0b101b]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pricing Tiers
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400 text-sm">
                🏷️
              </span>
            </div>
            <div className="mt-3 space-y-1 text-xs font-bold text-slate-700 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Monthly Plan:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">₹499 / mo</span>
              </div>
              <div className="flex justify-between">
                <span>Annual Plan:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">₹4,999 / yr</span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Stripe checkout recurring cycles
            </p>
          </div>
        </div>

        {/* Search & Filter Tools */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user, email or Stripe ID..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {(["all", "monthly", "yearly"] as const).map((plan) => (
              <button
                key={plan}
                onClick={() => setPlanFilter(plan)}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold capitalize transition cursor-pointer ${
                  planFilter === plan
                    ? "bg-slate-950 text-white dark:bg-emerald-600 dark:text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                }`}
              >
                {plan === "all" ? `All Plans (${payments.length})` : `${plan} (${payments.filter((p) => p.plan_type === plan).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-[#0b101b] overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-slate-500">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mb-2" />
              Loading payment history...
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-16 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-2xl">
                💳
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No payment transactions found
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                When golfers subscribe via Stripe, their payment transactions and revenue records will be listed here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200/80 bg-slate-50/70 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800/80 dark:bg-slate-900/50 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4">User / Subscriber</th>
                    <th className="px-6 py-4">Plan Type</th>
                    <th className="px-6 py-4">Amount Paid</th>
                    <th className="px-6 py-4">Payment Status</th>
                    <th className="px-6 py-4">Stripe Reference</th>
                    <th className="px-6 py-4">Transaction Date</th>
                    <th className="px-6 py-4">Next Billing Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-950 dark:text-white">
                          {p.user_name}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          {p.user_email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold capitalize ${
                            p.plan_type === "yearly"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800"
                          }`}
                        >
                          {p.plan_type === "yearly" ? "Annual (12 Mo)" : "Monthly (30 Days)"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                          ₹{p.amount.toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wider ${
                            p.status === "paid" || p.status === "active"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400"
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-mono text-slate-600 dark:text-slate-300">
                          {p.stripe_subscription_id || "Direct Entry"}
                        </div>
                        {p.stripe_customer_id && (
                          <div className="text-[10px] font-mono text-slate-400">
                            Cust: {p.stripe_customer_id}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                        {new Date(p.payment_date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                        {p.current_period_end
                          ? new Date(p.current_period_end).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </div>
  );
}
