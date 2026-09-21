"use client";

import { useEffect, useState } from "react";

type Report = {
  totalUsers: number;
  totalPrizePool: number;
  totalCharity: number;
  totalDraws: number;
  totalWinners: number;
  draws?: Array<{
    id: string;
    draw_month: string;
    status: string;
    total_prize_pool: number;
  }>;
};

export default function AdminReportsPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      try {
        const response = await fetch("/api/admin/reports");
        const data = await response.json();

        if (response.ok) {
          setReport(data);
        }
      } catch (err) {
        console.error("Error loading reports:", err);
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mb-3" />
          <p className="text-sm font-bold text-slate-500">Loading reports & analytics...</p>
        </div>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="p-8 text-center">
        <p className="text-sm text-rose-600 font-bold">Unable to load reports. Please try again.</p>
      </main>
    );
  }

  return (
    <main className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            👑 Admin Panel
          </span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">Executive Insights</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
          Reports & Analytics
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Audited platform metrics across members, prize pools, charity impact and monthly draws.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Users */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-[#0b101b]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Users
            </span>
            <span className="text-xl">👤</span>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            {report.totalUsers}
          </p>
          <p className="mt-1 text-xs text-slate-400">Registered member profiles</p>
        </div>

        {/* Total Prize Pool */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-[#0b101b]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Total Prize Pool
            </span>
            <span className="text-xl">🏆</span>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-amber-600 dark:text-amber-400">
            ₹{report.totalPrizePool.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-slate-400">Cumulative prize allocations</p>
        </div>

        {/* Charity Contributions */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-[#0b101b]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Charity Contributions
            </span>
            <span className="text-xl">❤️</span>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-rose-600 dark:text-rose-400">
            ₹{report.totalCharity.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-slate-400">Direct & prize donations given</p>
        </div>

        {/* Total Draws */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-[#0b101b]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Total Draws
            </span>
            <span className="text-xl">🎲</span>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">
            {report.totalDraws}
          </p>
          <p className="mt-1 text-xs text-slate-400">Scheduled monthly lottery rounds</p>
        </div>

        {/* Total Winners */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-[#0b101b]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Total Winners
            </span>
            <span className="text-xl">🎉</span>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
            {report.totalWinners}
          </p>
          <p className="mt-1 text-xs text-slate-400">Qualifying matched golfers (3-5 hits)</p>
        </div>
      </div>
    </main>
  );
}
