"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Draw = {
  id: string;
  draw_month: string;
  winning_numbers: number[];
  published_at: string | null;
};

export default function DrawResultsPage() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDraws() {
      try {
        const response = await fetch("/api/draws");
        const data = await response.json();

        if (response.ok) {
          setDraws(data.draws || []);
        }
      } catch (err) {
        console.error("Failed to load draws:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDraws();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="mx-auto max-w-5xl">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
          >
            &larr; Back to Home
          </Link>
          <Link
            href="/dashboard/draw"
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition"
          >
            Check My Tickets 🎟️
          </Link>
        </div>

        {/* Header */}
        <div className="mb-10 text-center sm:text-left">
          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Official Results
          </span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
            Monthly Sweepstakes Draws
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Publicly audited winning golf score numbers drawn each month.
          </p>
        </div>

        {/* Draws List */}
        {loading ? (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mb-3" />
            <p className="text-sm font-bold text-slate-500">Loading published draws...</p>
          </div>
        ) : draws.length === 0 ? (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="text-4xl">🎲</span>
            <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">No published draws yet</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              The monthly draw will appear here once official numbers are drawn and verified.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {draws.map((draw) => (
              <div
                key={draw.id}
                className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800/80 dark:bg-[#0b101b]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Draw Round
                    </span>
                    <h2 className="text-xl font-black text-slate-950 dark:text-white">
                      {new Date(draw.draw_month).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </h2>
                  </div>
                  {draw.published_at && (
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      Published: {new Date(draw.published_at).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Winning Numbers */}
                <div className="mt-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Official 5 Winning Numbers
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {draw.winning_numbers.map((number, idx) => (
                      <div
                        key={idx}
                        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-xl font-black text-amber-400 shadow-md ring-2 ring-amber-400/40 dark:bg-amber-500 dark:text-slate-950"
                      >
                        {number}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
