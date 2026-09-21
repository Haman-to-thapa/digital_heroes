"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface PrizeTier {
  winners: number;
  pool: number;
  prizeEach: number;
}

interface PrizeResult {
  fiveMatch: PrizeTier;
  fourMatch: PrizeTier;
  threeMatch: PrizeTier;
}

export default function AdminDrawPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [runningAll, setRunningAll] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  const [numbers, setNumbers] = useState<number[]>([]);
  const [drawStatus, setDrawStatus] = useState<string>("draft");
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [totalEntries, setTotalEntries] = useState<number>(0);
  const [totalWinners, setTotalWinners] = useState<number>(0);
  const [activeSubscribers, setActiveSubscribers] = useState<number>(0);
  const [prizeResult, setPrizeResult] = useState<PrizeResult | null>(null);

  async function loadCurrentDraw() {
    setLoading(true);
    try {
      const now = new Date();
      const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;

      // 1. Fetch current draw
      const { data: draw } = await supabase
        .from("draws")
        .select("*")
        .eq("draw_month", currentMonth)
        .maybeSingle();

      if (draw) {
        setDrawStatus(draw.status || "draft");
        if (draw.winning_numbers && Array.isArray(draw.winning_numbers)) {
          setNumbers(draw.winning_numbers);
        } else {
          setNumbers([]);
        }
        if (draw.published_at) {
          setPublishedAt(draw.published_at);
        }

        // Fetch entries count
        const { count: entriesCount } = await supabase
          .from("draw_entries")
          .select("*", { count: "exact", head: true })
          .eq("draw_id", draw.id);

        setTotalEntries(entriesCount || 0);

        // Fetch winners count & tiers
        const { data: winnersData } = await supabase
          .from("winners")
          .select("*")
          .eq("draw_id", draw.id);

        if (winnersData && winnersData.length > 0) {
          setTotalWinners(winnersData.length);

          const fiveW = winnersData.filter((w) => w.match_type === "5_match");
          const fourW = winnersData.filter((w) => w.match_type === "4_match");
          const threeW = winnersData.filter((w) => w.match_type === "3_match");

          setPrizeResult({
            fiveMatch: {
              winners: fiveW.length,
              pool: Number(draw.five_match_pool || 0),
              prizeEach: Number(fiveW[0]?.prize_amount || 0),
            },
            fourMatch: {
              winners: fourW.length,
              pool: Number(draw.four_match_pool || 0),
              prizeEach: Number(fourW[0]?.prize_amount || 0),
            },
            threeMatch: {
              winners: threeW.length,
              pool: Number(draw.three_match_pool || 0),
              prizeEach: Number(threeW[0]?.prize_amount || 0),
            },
          });
        } else {
          setTotalWinners(0);
          setPrizeResult(null);
        }
      }

      // 2. Fetch active subscribers count for pool estimation
      const { count: subCount } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      setActiveSubscribers(subCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCurrentDraw();
  }, []);

  // 1. Simulate 5 Numbers
  async function simulateDraw() {
    setSimulating(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/draw/simulate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Simulation failed");
        setMessageType("error");
        return false;
      }
      setNumbers(data.draw?.winning_numbers || []);
      setDrawStatus(data.draw?.status || "simulated");
      setMessage("Step 1 Complete: 5 Lucky Numbers have been generated!");
      setMessageType("success");
      return true;
    } catch (err) {
      console.error(err);
      setMessage("Failed to simulate numbers");
      setMessageType("error");
      return false;
    } finally {
      setSimulating(false);
    }
  }

  // 2. Publish Draw
  async function publishDraw() {
    setPublishing(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/draw/publish", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Publish failed");
        setMessageType("error");
        return false;
      }
      setDrawStatus("published");
      setPublishedAt(data.draw?.published_at || new Date().toISOString());
      setMessage("Step 2 Complete: Draw is officially published & locked for all golfers!");
      setMessageType("success");
      return true;
    } catch (err) {
      console.error(err);
      setMessage("Failed to publish draw");
      setMessageType("error");
      return false;
    } finally {
      setPublishing(false);
    }
  }

  // 3. Calculate Results & Prizes
  async function calculateAllPrizes() {
    setCalculating(true);
    setMessage("");
    try {
      // Step A: Calculate score matches and entries
      const calcRes = await fetch("/api/admin/draw/calculate", { method: "POST" });
      const calcData = await calcRes.json();
      if (!calcRes.ok) {
        setMessage(calcData.error || "Calculation failed");
        setMessageType("error");
        return false;
      }

      setTotalEntries(calcData.totalEntries || 0);
      setTotalWinners(calcData.totalWinners || 0);

      // Step B: Calculate prize pools from subscribers
      await fetch("/api/admin/draw/prize-pool", { method: "POST" });

      // Step C: Distribute prize tiers
      const prizeRes = await fetch("/api/admin/draw/prizes", { method: "POST" });
      const prizeData = await prizeRes.json();

      if (prizeRes.ok) {
        setPrizeResult({
          fiveMatch: prizeData.fiveMatch,
          fourMatch: prizeData.fourMatch,
          threeMatch: prizeData.threeMatch,
        });
        setMessage(
          `Step 3 Complete: ${calcData.totalWinners} winners identified and cash prizes calculated!`
        );
        setMessageType("success");
        return true;
      } else {
        setMessage(prizeData.error || "Failed to finalize prizes");
        setMessageType("error");
        return false;
      }
    } catch (err) {
      console.error(err);
      setMessage("Calculation error occurred");
      setMessageType("error");
      return false;
    } finally {
      setCalculating(false);
    }
  }

  // Automated 1-Click Execution
  async function runEntireDraw() {
    setRunningAll(true);
    setMessage("Starting 1-Click Automated Draw...");
    setMessageType("info");

    try {
      // 1. Simulate if needed
      if (numbers.length !== 5 || drawStatus === "draft") {
        setMessage("Step 1/3: Generating 5 Lucky Winning Numbers...");
        const simOk = await simulateDraw();
        if (!simOk) {
          setRunningAll(false);
          return;
        }
      }

      // 2. Publish if not published
      if (drawStatus !== "published") {
        setMessage("Step 2/3: Publishing and locking the draw...");
        const pubOk = await publishDraw();
        if (!pubOk) {
          setRunningAll(false);
          return;
        }
      }

      // 3. Calculate winners and cash prizes
      setMessage("Step 3/3: Evaluating golfer scorecards & calculating cash prizes...");
      await calculateAllPrizes();

      setMessage("🎉 Full Monthly Draw Executed Successfully in 1-Click!");
      setMessageType("success");
      await loadCurrentDraw();
    } catch (err) {
      console.error(err);
      setMessage("Automated draw execution encountered an issue.");
      setMessageType("error");
    } finally {
      setRunningAll(false);
    }
  }

  // Reset Draw to Draft
  async function handleResetDraw() {
    if (!confirm("Are you sure you want to reset this month's draw to draft? This will clear current winning numbers and winners so you can run it fresh.")) {
      return;
    }
    setResetting(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/draw/reset", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMessage("Draw has been reset to draft. You can now generate fresh numbers.");
        setMessageType("info");
        await loadCurrentDraw();
      } else {
        setMessage(data.error || "Reset failed");
        setMessageType("error");
      }
    } catch (err) {
      console.error(err);
      setMessage("Reset request failed");
      setMessageType("error");
    } finally {
      setResetting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-[#070b12] text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            <Link href="/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <span>/</span>
            <span>Admin</span>
            <span>/</span>
            <span className="text-slate-600 dark:text-slate-300">Draw Management</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/winners"
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              🏆 View Winners Proofs
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              ← Dashboard Hub
            </Link>
          </div>
        </div>

        {/* Hero Header Card */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-[#0b101b] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Monthly Sweepstakes Engine
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider ${
                    drawStatus === "published"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300"
                      : drawStatus === "simulated"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  Status: {drawStatus}
                </span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Monthly Draw Controller
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
                Golfers submit 5 scores each month. In this control panel, you generate the 5 lucky winning numbers, announce the draw, and calculate cash prizes for 5, 4, and 3-number matches.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleResetDraw}
                disabled={resetting || runningAll}
                className="rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-bold text-rose-600 shadow-xs hover:bg-rose-50 dark:border-rose-900 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-950/30 cursor-pointer disabled:opacity-50"
                title="Reset draw to draft to test or run numbers again"
              >
                {resetting ? "Resetting..." : "🔄 Reset Draw"}
              </button>
            </div>
          </div>

          {/* Quick Notice Alert */}
          {message && (
            <div
              className={`mt-6 rounded-2xl border p-4 text-sm font-semibold flex items-center gap-3 ${
                messageType === "success"
                  ? "border-emerald-500/40 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : messageType === "error"
                  ? "border-rose-500/40 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
                  : "border-blue-500/40 bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
              }`}
            >
              <span className="text-lg">{messageType === "success" ? "✅" : messageType === "error" ? "⚠️" : "ℹ️"}</span>
              <span>{message}</span>
            </div>
          )}
        </div>

        {/* ⚡ THE 1-CLICK AUTOMATED DRAW EXECUTION HERO */}
        <div className="rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-6 shadow-md dark:border-emerald-500/30 dark:bg-[#091515] sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-0.5 text-xs font-black uppercase tracking-wider text-slate-950">
                ⚡ Fastest Way
              </span>
              <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                Run Complete Draw Automatically (1-Click)
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl">
                Don&apos;t want to do individual steps? Click once to automatically generate 5 numbers, publish to all golfers, and calculate cash prizes instantly!
              </p>
            </div>

            <button
              type="button"
              onClick={runEntireDraw}
              disabled={runningAll || simulating || publishing || calculating}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-8 py-4 text-base font-extrabold text-white shadow-lg shadow-emerald-600/30 transition-all hover:bg-emerald-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {runningAll ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Executing Draw...</span>
                </>
              ) : (
                <>
                  <span className="text-xl">▶️</span>
                  <span>Run Complete Draw</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* VISUAL 3-STEP EXPLAINER / MANUAL CONTROLS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Step-by-Step Draw Lifecycle
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Active Subscribers: <strong className="text-emerald-600 dark:text-emerald-400">{activeSubscribers}</strong>
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* STEP 1 CARD: NUMBERS */}
            <div
              className={`flex flex-col justify-between rounded-2xl border p-6 shadow-sm transition-all ${
                numbers.length === 5
                  ? "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/20"
                  : "border-slate-200/80 bg-white dark:border-slate-800 dark:bg-[#0b101b]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white dark:bg-emerald-500 dark:text-slate-950">
                    1
                  </span>
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider ${
                      numbers.length === 5 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                    }`}
                  >
                    {numbers.length === 5 ? "✓ Numbers Ready" : "Pending"}
                  </span>
                </div>

                <h4 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                  Pick 5 Lucky Numbers
                </h4>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Generates 5 unique random numbers between 1 and 45.
                </p>

                {/* Display Numbers Balls */}
                <div className="my-5 flex flex-wrap items-center gap-2">
                  {numbers.length === 5 ? (
                    numbers.map((num, i) => (
                      <div
                        key={i}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-sm font-black text-white shadow-md"
                      >
                        {num}
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-slate-400 italic py-2">
                      <span>No numbers generated yet.</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={simulateDraw}
                disabled={simulating || runningAll || drawStatus === "published"}
                className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-40 dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
              >
                {simulating ? "Generating..." : numbers.length === 5 ? "Regenerate Numbers 🎲" : "Generate 5 Numbers 🎲"}
              </button>
            </div>

            {/* STEP 2 CARD: PUBLISH */}
            <div
              className={`flex flex-col justify-between rounded-2xl border p-6 shadow-sm transition-all ${
                drawStatus === "published"
                  ? "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/20"
                  : "border-slate-200/80 bg-white dark:border-slate-800 dark:bg-[#0b101b]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white dark:bg-emerald-500 dark:text-slate-950">
                    2
                  </span>
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider ${
                      drawStatus === "published" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                    }`}
                  >
                    {drawStatus === "published" ? "✓ Published" : "Draft"}
                  </span>
                </div>

                <h4 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                  Publish to Golfers
                </h4>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Locks the numbers and makes them public for all golfers to view.
                </p>

                <div className="my-5 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/60">
                  <p className="text-slate-500 dark:text-slate-400">
                    Status:{" "}
                    <strong className="text-slate-900 dark:text-white capitalize">
                      {drawStatus}
                    </strong>
                  </p>
                  {publishedAt && (
                    <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                      Date: {new Date(publishedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={publishDraw}
                disabled={publishing || runningAll || numbers.length !== 5 || drawStatus === "published"}
                className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-500 disabled:opacity-40 cursor-pointer"
              >
                {publishing ? "Publishing..." : drawStatus === "published" ? "Draw Published ✓" : "Publish Draw Now 📢"}
              </button>
            </div>

            {/* STEP 3 CARD: CALCULATE WINNERS & PRIZES */}
            <div
              className={`flex flex-col justify-between rounded-2xl border p-6 shadow-sm transition-all ${
                totalWinners > 0
                  ? "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/20"
                  : "border-slate-200/80 bg-white dark:border-slate-800 dark:bg-[#0b101b]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white dark:bg-emerald-500 dark:text-slate-950">
                    3
                  </span>
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider ${
                      totalWinners > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                    }`}
                  >
                    {totalWinners > 0 ? `✓ ${totalWinners} Winners` : "Needs Calculation"}
                  </span>
                </div>

                <h4 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                  Match Scores & Prizes
                </h4>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Scans golfers&apos; submitted scorecards, awards 5, 4, and 3-match prizes.
                </p>

                <div className="my-5 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Total Entries:</span>
                    <strong className="text-slate-900 dark:text-white">{totalEntries}</strong>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-slate-500 dark:text-slate-400">Total Winners:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">{totalWinners}</strong>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={calculateAllPrizes}
                disabled={calculating || runningAll || drawStatus !== "published"}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-500 disabled:opacity-40 cursor-pointer"
              >
                {calculating ? "Calculating..." : "Calculate Winners & Prizes 💰"}
              </button>
            </div>
          </div>
        </div>

        {/* PRIZE POOL BREAKDOWN & WINNERS SUMMARY */}
        {prizeResult && (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-[#0b101b] sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Prize Distribution Breakdown
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Calculated from active member subscriptions
                </p>
              </div>
              <Link
                href="/admin/winners"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500"
              >
                Go to Winner Approvals & Payouts &rarr;
              </Link>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {/* 5-Match */}
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-black text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  🌟 5-Match Jackpot (40%)
                </span>
                <p className="mt-3 text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                  ₹{Number(prizeResult.fiveMatch.prizeEach).toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {prizeResult.fiveMatch.winners} Winner{prizeResult.fiveMatch.winners === 1 ? "" : "s"} • Pool: ₹{Number(prizeResult.fiveMatch.pool).toLocaleString("en-IN")}
                </p>
              </div>

              {/* 4-Match */}
              <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-5">
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-black text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                  ⭐ 4-Match Second Tier (35%)
                </span>
                <p className="mt-3 text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  ₹{Number(prizeResult.fourMatch.prizeEach).toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {prizeResult.fourMatch.winners} Winner{prizeResult.fourMatch.winners === 1 ? "" : "s"} • Pool: ₹{Number(prizeResult.fourMatch.pool).toLocaleString("en-IN")}
                </p>
              </div>

              {/* 3-Match */}
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  🥉 3-Match Third Tier (25%)
                </span>
                <p className="mt-3 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  ₹{Number(prizeResult.threeMatch.prizeEach).toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {prizeResult.threeMatch.winners} Winner{prizeResult.threeMatch.winners === 1 ? "" : "s"} • Pool: ₹{Number(prizeResult.threeMatch.pool).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
