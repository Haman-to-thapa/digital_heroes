"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AdminDrawPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [calculatingPrize, setCalculatingPrize] = useState(false);
  const [message, setMessage] = useState("");
  const [numbers, setNumbers] = useState<number[]>([]);
  const [drawStatus, setDrawStatus] = useState<string>("draft");
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [result, setResult] = useState<{
    totalEntries: number;
    totalWinners: number;
  } | null>(null);

  const [prizeResult, setPrizeResult] = useState<{
    fiveMatch: {
      winners: number;
      pool: number;
      prizeEach: number;
    };
    fourMatch: {
      winners: number;
      pool: number;
      prizeEach: number;
    };
    threeMatch: {
      winners: number;
      pool: number;
      prizeEach: number;
    };
  } | null>(null);

  useEffect(() => {
    async function loadCurrentDraw() {
      const now = new Date();
      const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;

      const { data: draw } = await supabase
        .from("draws")
        .select("*")
        .eq("draw_month", currentMonth)
        .maybeSingle();

      if (draw) {
        setDrawStatus(draw.status || "draft");
        if (draw.winning_numbers && draw.winning_numbers.length === 5) {
          setNumbers(draw.winning_numbers);
        }
        if (draw.published_at) {
          setPublishedAt(draw.published_at);
        }

        // If already published, check if winners have been calculated
        if (draw.status === "published") {
          const { count: entriesCount } = await supabase
            .from("draw_entries")
            .select("*", { count: "exact", head: true })
            .eq("draw_id", draw.id);

          const { data: winnersData } = await supabase
            .from("winners")
            .select("*")
            .eq("draw_id", draw.id);

          if (winnersData && winnersData.length > 0) {
            setResult({
              totalEntries: entriesCount || 0,
              totalWinners: winnersData.length,
            });

            // Check if prizes are already calculated
            const fiveW = winnersData.filter((w) => w.match_type === "5_match");
            const fourW = winnersData.filter((w) => w.match_type === "4_match");
            const threeW = winnersData.filter((w) => w.match_type === "3_match");

            if (winnersData.some((w) => Number(w.prize_amount) > 0)) {
              setPrizeResult({
                fiveMatch: {
                  winners: fiveW.length,
                  pool: Number(draw.five_match_pool || 0),
                  prizeEach: fiveW[0]?.prize_amount || 0,
                },
                fourMatch: {
                  winners: fourW.length,
                  pool: Number(draw.four_match_pool || 0),
                  prizeEach: fourW[0]?.prize_amount || 0,
                },
                threeMatch: {
                  winners: threeW.length,
                  pool: Number(draw.three_match_pool || 0),
                  prizeEach: threeW[0]?.prize_amount || 0,
                },
              });
            }
          }
        }
      }
    }

    loadCurrentDraw();
  }, [supabase]);

  async function simulateDraw() {
    setLoading(true);
    setMessage("");
    setNumbers([]);
    setResult(null);
    setPrizeResult(null);

    try {
      const response = await fetch("/api/admin/draw/simulate", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Simulation failed");
        return;
      }

      setNumbers(data.draw.winning_numbers || []);
      setDrawStatus(data.draw.status || "simulated");
      setMessage("Draw simulated successfully.");
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function publishDraw() {
    setPublishing(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/draw/publish", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Publish failed");
        return;
      }

      setDrawStatus(data.draw?.status || "published");
      setPublishedAt(data.draw?.published_at || new Date().toISOString());
      setMessage("Draw published successfully.");
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong.");
    } finally {
      setPublishing(false);
    }
  }

  async function calculateResults() {
    setCalculating(true);
    setMessage("");
    setResult(null);
    setPrizeResult(null);

    try {
      const response = await fetch("/api/admin/draw/calculate", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Calculation failed");
        return;
      }

      setResult({
        totalEntries: data.totalEntries,
        totalWinners: data.totalWinners,
      });

      setMessage("Draw results calculated successfully.");
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong.");
    } finally {
      setCalculating(false);
    }
  }

  async function calculatePrizes() {
    setCalculatingPrize(true);
    setMessage("");
    setPrizeResult(null);

    try {
      // 1. Ensure prize pool is calculated from active subscriptions first
      await fetch("/api/admin/draw/prize-pool", { method: "POST" });

      // 2. Calculate and split individual prizes among winners
      const response = await fetch("/api/admin/draw/prizes", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Prize calculation failed");
        return;
      }

      setPrizeResult({
        fiveMatch: data.fiveMatch,
        fourMatch: data.fourMatch,
        threeMatch: data.threeMatch,
      });

      setMessage("Winner prizes calculated successfully.");
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong.");
    } finally {
      setCalculatingPrize(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 dark:bg-[#070b12] text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-gray-900 sm:p-8">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              ADMIN · DRAW MANAGEMENT
            </p>
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  drawStatus === "published"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                    : drawStatus === "simulated"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                Status: {drawStatus}
              </span>
              <Link
                href="/dashboard"
                className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                ← Dashboard
              </Link>
            </div>
          </div>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Draw Management & Execution
          </h1>

          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Complete draw lifecycle: Simulate numbers → Publish draw → Calculate matches → Distribute tier prizes.
          </p>

          {publishedAt && (
            <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Published on: {new Date(publishedAt).toLocaleString()}
            </p>
          )}

          {/* Action Buttons Sequence */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {/* 1. Simulate Draw */}
            <button
              type="button"
              onClick={simulateDraw}
              disabled={loading || drawStatus === "published"}
              className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400 cursor-pointer"
            >
              {loading ? "Simulating..." : "1. Simulate Draw"}
            </button>

            {/* 2. Publish Draw */}
            {numbers.length === 5 && (
              <button
                type="button"
                onClick={publishDraw}
                disabled={publishing || drawStatus === "published"}
                className="rounded-xl border border-emerald-600 bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
              >
                {publishing
                  ? "Publishing..."
                  : drawStatus === "published"
                  ? "2. Draw Published ✓"
                  : "2. Publish Draw"}
              </button>
            )}

            {/* 3. Calculate Results */}
            {drawStatus === "published" && (
              <button
                type="button"
                onClick={calculateResults}
                disabled={calculating}
                className="rounded-xl border border-indigo-600 bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50 cursor-pointer"
              >
                {calculating ? "Calculating..." : "3. Calculate Results"}
              </button>
            )}

            {/* 4. Calculate Prize */}
            {result && result.totalWinners > 0 && (
              <button
                type="button"
                onClick={calculatePrizes}
                disabled={calculatingPrize}
                className="rounded-xl border border-amber-600 bg-amber-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-500 disabled:opacity-50 cursor-pointer"
              >
                {calculatingPrize ? "Calculating Prize..." : "4. Calculate Prize"}
              </button>
            )}
          </div>

          {/* Feedback Message */}
          {message && (
            <div
              className={`mt-5 rounded-xl border p-4 text-sm font-medium ${
                message.includes("successfully")
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400"
              }`}
            >
              {message}
            </div>
          )}

          {/* Results Summary Card */}
          {result && (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 dark:border-emerald-900/60 dark:bg-emerald-950/30">
              <div className="flex items-center justify-between">
                <p className="text-base font-bold text-slate-900 dark:text-white">
                  Draw Results Summary
                </p>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                  Matches Evaluated ✓
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Total Entries Evaluated
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
                    {result.totalEntries}
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-xs dark:border-emerald-900/40 dark:bg-slate-900">
                  <p className="text-xs font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Qualified Winners (3+ Matches)
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {result.totalWinners}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Prize Distribution Tier Cards */}
          {prizeResult && (
            <div className="mt-6 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Prize Split Breakdown (40% / 35% / 25%)
              </p>

              <div className="grid gap-4 md:grid-cols-3">
                {/* 5 Match */}
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      5 Match (Jackpot 40%)
                    </p>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                      Tier 1
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                    ₹{prizeResult.fiveMatch.prizeEach.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {prizeResult.fiveMatch.winners} winner(s) • Total pool: ₹{prizeResult.fiveMatch.pool.toLocaleString()}
                  </p>
                </div>

                {/* 4 Match */}
                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      4 Match (35% Pool)
                    </p>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                      Tier 2
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                    ₹{prizeResult.fourMatch.prizeEach.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {prizeResult.fourMatch.winners} winner(s) • Total pool: ₹{prizeResult.fourMatch.pool.toLocaleString()}
                  </p>
                </div>

                {/* 3 Match */}
                <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/50 p-5 dark:border-indigo-900/50 dark:bg-indigo-950/20">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                      3 Match (25% Pool)
                    </p>
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
                      Tier 3
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                    ₹{prizeResult.threeMatch.prizeEach.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {prizeResult.threeMatch.winners} winner(s) • Total pool: ₹{prizeResult.threeMatch.pool.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Numbers Display */}
          {numbers.length === 5 && (
            <div className="mt-8 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-6 dark:border-slate-800 dark:bg-slate-800/40">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {drawStatus === "published" ? "Official Winning Numbers" : "Simulated Winning Numbers"}
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                {numbers.map((number, idx) => (
                  <div
                    key={`${number}-${idx}`}
                    className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm text-xl font-extrabold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-emerald-400"
                  >
                    {number}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
