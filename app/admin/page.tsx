"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Stats = {
  users: number;
  prizePool: number;
  charityTotal: number;
  draws: number;
  activeSubscriptions: number;
  totalWinners: number;
};

export default function AdminPage() {
  const supabase = createClient();
  const [stats, setStats] = useState<Stats>({
    users: 0,
    prizePool: 0,
    charityTotal: 0,
    draws: 0,
    activeSubscriptions: 0,
    totalWinners: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [
          { count: userCount },
          { data: drawData },
          { data: donationData },
          { count: drawCount },
          { count: subCount },
          { count: winnerCount },
        ] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("draws").select("total_prize_pool"),
          supabase.from("donations").select("amount"),
          supabase.from("draws").select("*", { count: "exact", head: true }),
          supabase
            .from("subscriptions")
            .select("*", { count: "exact", head: true })
            .eq("status", "active"),
          supabase.from("winners").select("*", { count: "exact", head: true }),
        ]);

        const totalPool = drawData?.reduce(
          (sum, item) => sum + Number(item.total_prize_pool || 0),
          0
        ) || 0;

        const totalCharity = donationData?.reduce(
          (sum, item) => sum + Number(item.amount || 0),
          0
        ) || 0;

        setStats({
          users: userCount || 0,
          prizePool: totalPool,
          charityTotal: totalCharity,
          draws: drawCount || 0,
          activeSubscriptions: subCount || 0,
          totalWinners: winnerCount || 0,
        });
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  const kpis = [
    {
      label: "Total Users",
      value: stats.users,
      display: stats.users.toLocaleString("en-IN"),
      icon: "👤",
      color: "text-slate-950 dark:text-white",
      bg: "bg-slate-50 dark:bg-slate-900/60",
      border: "border-slate-200 dark:border-slate-800",
      href: "/admin/users",
    },
    {
      label: "Active Subscriptions",
      value: stats.activeSubscriptions,
      display: stats.activeSubscriptions.toLocaleString("en-IN"),
      icon: "🎫",
      color: "text-indigo-700 dark:text-indigo-400",
      bg: "bg-indigo-50/60 dark:bg-indigo-950/20",
      border: "border-indigo-200/60 dark:border-indigo-900/40",
      href: "/admin/subscriptions",
    },
    {
      label: "Total Prize Pool",
      value: stats.prizePool,
      display: `₹${stats.prizePool.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      icon: "💰",
      color: "text-emerald-700 dark:text-emerald-400",
      bg: "bg-emerald-50/60 dark:bg-emerald-950/20",
      border: "border-emerald-200/60 dark:border-emerald-900/40",
      href: "/admin/payments",
    },
    {
      label: "Charity Contributions",
      value: stats.charityTotal,
      display: `₹${stats.charityTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      icon: "❤️",
      color: "text-rose-700 dark:text-rose-400",
      bg: "bg-rose-50/60 dark:bg-rose-950/20",
      border: "border-rose-200/60 dark:border-rose-900/40",
      href: "/admin/charity",
    },
    {
      label: "Total Draws Run",
      value: stats.draws,
      display: stats.draws.toLocaleString("en-IN"),
      icon: "🎲",
      color: "text-amber-700 dark:text-amber-400",
      bg: "bg-amber-50/60 dark:bg-amber-950/20",
      border: "border-amber-200/60 dark:border-amber-900/40",
      href: "/admin/draw",
    },
    {
      label: "Total Winners",
      value: stats.totalWinners,
      display: stats.totalWinners.toLocaleString("en-IN"),
      icon: "🏆",
      color: "text-amber-700 dark:text-amber-400",
      bg: "bg-amber-50/60 dark:bg-amber-950/20",
      border: "border-amber-200/60 dark:border-amber-900/40",
      href: "/admin/winners",
    },
  ];

  const quickLinks = [
    { label: "Run Monthly Draw", href: "/admin/draw", icon: "🎲", desc: "Generate this month's numbers" },
    { label: "Review Proofs", href: "/admin/winners", icon: "🔍", desc: "Approve winner screenshots" },
    { label: "Manage Users", href: "/admin/users", icon: "👥", desc: "View & manage all members" },
    { label: "Charity Report", href: "/admin/charity", icon: "❤️", desc: "See donation breakdown" },
  ];

  return (
    <main className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            👑 Admin Panel
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
          Platform Overview
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Digital Heroes platform statistics at a glance.
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className={`group rounded-3xl border ${kpi.border} ${kpi.bg} p-6 transition hover:shadow-md hover:scale-[1.01]`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {kpi.label}
              </span>
              <span className="text-lg">{kpi.icon}</span>
            </div>
            {loading ? (
              <div className="mt-3 h-9 w-28 animate-pulse rounded-xl bg-slate-200/60 dark:bg-slate-800/60" />
            ) : (
              <p className={`mt-3 text-3xl font-black tracking-tight ${kpi.color}`}>
                {kpi.display}
              </p>
            )}
            <p className="mt-2 text-[10px] font-semibold text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition">
              View details →
            </p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-[#0b101b]">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
          Quick Actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition hover:border-amber-300 hover:bg-amber-50/40 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-amber-700/60 dark:hover:bg-amber-950/20"
            >
              <span className="text-xl mt-0.5">{link.icon}</span>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{link.label}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{link.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
