"use client";

import { useEffect, useState } from "react";

type PrizeResult = {
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
};

export default function AdminDrawPage() {
  const [drawType, setDrawType] = useState<"random" | "algorithmic">("random");
  const [numbers, setNumbers] = useState<number[]>([]);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [poolLoading, setPoolLoading] = useState(false);
  const [prizeLoading, setPrizeLoading] = useState(false);

  const [result, setResult] = useState<{
    totalEntries: number;
    totalWinners: number;
  } | null>(null);

  const [prizeResult, setPrizeResult] = useState<PrizeResult | null>(null);

  async function simulateDraw() {
    setLoading(true);
    setMessage(null);
    setNumbers([]);
    setResult(null);
    setPrizeResult(null);

    try {
      const response = await fetch("/api/admin/draw/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          draw_type: drawType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ text: data.error || "Simulation failed.", ok: false });
        return;
      }

      setNumbers(data.draw.winning_numbers || []);
      setMessage({ text: `Draw simulated successfully using ${drawType} algorithm. ✅`, ok: true });
    } catch {
      setMessage({ text: "Something went wrong during simulation.", ok: false });
    } finally {
      setLoading(false);
    }
  }

  async function calculatePrizePool() {
    setPoolLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/draw/prize-pool", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ text: data.error || "Prize pool calculation failed.", ok: false });
        return;
      }

      setMessage({
        text: `Prize pool calculated. Total pool: ₹${Number(data.basePrizePool || data.totalPrizePool || 0).toFixed(2)} ✅`,
        ok: true,
      });
    } catch {
      setMessage({ text: "Something went wrong calculating prize pool.", ok: false });
    } finally {
      setPoolLoading(false);
    }
  }

  async function publishDraw() {
    setPublishing(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/draw/publish", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ text: data.error || "Publish failed.", ok: false });
        return;
      }

      setMessage({ text: "Draw published successfully! Public results are now live. 🎉", ok: true });
    } catch {
      setMessage({ text: "Something went wrong publishing draw.", ok: false });
    } finally {
      setPublishing(false);
    }
  }

  async function calculateResults() {
    setCalculating(true);
    setMessage(null);
    setResult(null);

    try {
      const response = await fetch("/api/admin/draw/calculate", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ text: data.error || "Calculation failed.", ok: false });
        return;
      }

      setResult({
        totalEntries: data.totalEntries,
        totalWinners: data.totalWinners,
      });

      setMessage({
        text: `Draw results calculated! Found ${data.totalWinners} winner(s) out of ${data.totalEntries} entries.${data.jackpotRollover ? ` Jackpot rollover: ₹${data.jackpotRollover.toFixed(2)}` : ""} ✅`,
        ok: true,
      });
    } catch {
      setMessage({ text: "Something went wrong calculating results.", ok: false });
    } finally {
      setCalculating(false);
    }
  }

  async function calculatePrizes() {
    setPrizeLoading(true);
    setMessage(null);
    setPrizeResult(null);

    try {
      const response = await fetch("/api/admin/draw/prizes", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ text: data.error || "Prize calculation failed.", ok: false });
        return;
      }

      setPrizeResult(data);
      setMessage({ text: "Winner prizes calculated and distributed across tiers successfully! 🏆", ok: true });
    } catch {
      setMessage({ text: "Something went wrong calculating prizes.", ok: false });
    } finally {
      setPrizeLoading(false);
    }
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
          <span className="text-xs text-slate-500 dark:text-slate-400">Monthly Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
          Monthly Draw
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Simulate, calculate, publish and distribute prizes for the monthly golf score draw.
        </p>
      </div>

      {/* Action message */}
      {message && (
        <div
          className={`rounded-2xl border px-5 py-3.5 text-sm font-semibold ${
            message.ok
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
              : "border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Draw Controls Container */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800/80 dark:bg-[#0b101b]">
        <div className="max-w-md">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Draw Algorithm Type
          </label>
          <select
            value={drawType}
            onChange={(e) => setDrawType(e.target.value as "random" | "algorithmic")}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="random">🎲 Random Draw (1 - 45)</option>
            <option value="algorithmic">🧠 Algorithmic (Weighted by Golf Score Frequency)</option>
          </select>
          <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
            {drawType === "algorithmic"
              ? "Weights numbers according to active members' registered golf scores."
              : "Generates completely unbiased random numbers between 1 and 45."}
          </p>
        </div>

        {/* Action buttons bar */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={simulateDraw}
            disabled={loading}
            className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-amber-500 disabled:opacity-50 cursor-pointer transition"
          >
            {loading ? "Simulating…" : "⚡ Simulate Draw"}
          </button>

          <button
            type="button"
            onClick={calculatePrizePool}
            disabled={poolLoading}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 disabled:opacity-50 cursor-pointer transition"
          >
            {poolLoading ? "Calculating…" : "💰 Calculate Prize Pool"}
          </button>
        </div>

        {/* Winning numbers visual balls */}
        {numbers.length === 5 && (
          <div className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 dark:border-amber-500/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Simulated Winning Numbers
              </span>
              <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase">
                {drawType}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {numbers.map((number, idx) => (
                <div
                  key={idx}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-xl font-black text-amber-400 shadow-md ring-2 ring-amber-400/40 dark:bg-amber-500 dark:text-slate-950"
                >
                  {number}
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={publishDraw}
                disabled={publishing}
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 cursor-pointer transition"
              >
                {publishing ? "Publishing…" : "📢 Publish Draw"}
              </button>

              <button
                type="button"
                onClick={calculateResults}
                disabled={calculating}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 disabled:opacity-50 cursor-pointer transition"
              >
                {calculating ? "Calculating…" : "🎯 Calculate Results"}
              </button>
            </div>
          </div>
        )}

        {/* Results summary */}
        {result && (
          <div className="mt-8 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-6 dark:border-slate-800 dark:bg-slate-900/50">
            <h2 className="text-base font-black text-slate-950 dark:text-white">
              Draw Outcome
            </h2>

            <div className="mt-3 flex flex-wrap gap-6 text-sm">
              <div className="rounded-xl bg-white px-4 py-2.5 border border-slate-200/60 dark:bg-slate-800 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400">Total Entries: </span>
                <span className="font-bold text-slate-950 dark:text-white">{result.totalEntries}</span>
              </div>
              <div className="rounded-xl bg-white px-4 py-2.5 border border-slate-200/60 dark:bg-slate-800 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400">Winners (3+ Matches): </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{result.totalWinners}</span>
              </div>
            </div>

            {result.totalWinners > 0 && (
              <div className="mt-5">
                <button
                  type="button"
                  onClick={calculatePrizes}
                  disabled={prizeLoading}
                  className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-amber-500 disabled:opacity-50 cursor-pointer transition"
                >
                  {prizeLoading ? "Calculating Prizes…" : "🏆 Calculate Winner Prizes"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Prize breakdown cards */}
        {prizeResult && (
          <div className="mt-8 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Prize Distribution By Tier
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 dark:border-amber-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-amber-700 dark:text-amber-400">
                    5 Matches (Jackpot 40%)
                  </span>
                  <span className="text-lg">👑</span>
                </div>
                <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                  ₹{Number(prizeResult.fiveMatch.prizeEach).toFixed(2)}
                  <span className="text-xs font-normal text-slate-500"> / each</span>
                </p>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  <p>{prizeResult.fiveMatch.winners} winner(s)</p>
                  <p className="text-[11px] text-slate-400">Tier Pool: ₹{Number(prizeResult.fiveMatch.pool).toFixed(2)}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-5 dark:border-indigo-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-indigo-700 dark:text-indigo-400">
                    4 Matches (35%)
                  </span>
                  <span className="text-lg">🥈</span>
                </div>
                <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                  ₹{Number(prizeResult.fourMatch.prizeEach).toFixed(2)}
                  <span className="text-xs font-normal text-slate-500"> / each</span>
                </p>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  <p>{prizeResult.fourMatch.winners} winner(s)</p>
                  <p className="text-[11px] text-slate-400">Tier Pool: ₹{Number(prizeResult.fourMatch.pool).toFixed(2)}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 dark:border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-400">
                    3 Matches (25%)
                  </span>
                  <span className="text-lg">🥉</span>
                </div>
                <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                  ₹{Number(prizeResult.threeMatch.prizeEach).toFixed(2)}
                  <span className="text-xs font-normal text-slate-500"> / each</span>
                </p>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  <p>{prizeResult.threeMatch.winners} winner(s)</p>
                  <p className="text-[11px] text-slate-400">Tier Pool: ₹{Number(prizeResult.threeMatch.pool).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
