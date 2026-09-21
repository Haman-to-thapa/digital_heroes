"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Winner {
  id: string;
  user_id: string;
  match_type: "5_match" | "4_match" | "3_match";
  prize_amount: number;
  verification_status: "pending" | "approved" | "rejected";
  payout_status: "pending" | "paid";
  full_name: string;
  draw_month: string | null;
  created_at: string;
  proof: {
    id: string;
    file_url: string;
    signedUrl: string;
    created_at: string;
  } | null;
}

export default function AdminWinnersPage() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string>("");

  async function loadWinners() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/winners");
      const data = await res.json();
      if (res.ok) {
        setWinners(data.winners || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWinners();
  }, []);

  async function updateWinnerStatus(
    winnerId: string,
    verificationStatus: "approved" | "rejected",
    payoutStatus?: "paid" | "pending"
  ) {
    setUpdatingId(winnerId);
    setActionMessage("");
    try {
      const res = await fetch("/api/admin/winners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          winnerId,
          verification_status: verificationStatus,
          ...(payoutStatus ? { payout_status: payoutStatus } : {}),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(`Winner successfully marked as ${verificationStatus}!`);
        await loadWinners();
      } else {
        setActionMessage(data.error || "Failed to update winner status");
      }
    } catch (err) {
      console.error(err);
      setActionMessage("Network error updating winner");
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredWinners = winners.filter((w) => {
    const matchesStatus = filter === "all" ? true : w.verification_status === filter;
    const matchesTier = tierFilter === "all" ? true : w.match_type === tierFilter;
    return matchesStatus && matchesTier;
  });

  const totalPrizeAwarded = winners.reduce((acc, curr) => acc + Number(curr.prize_amount || 0), 0);
  const approvedCount = winners.filter((w) => w.verification_status === "approved").length;
  const paidCount = winners.filter((w) => w.payout_status === "paid").length;

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-[#070b12] text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-6 dark:border-slate-800/80">
          <div>
            <div className="flex items-center space-x-2">
              <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                👑 Admin Control Center
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Winning History & Approvals
              </span>
            </div>

            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              All Winning History & Payouts 🏆
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Audit all winners ever declared across every monthly sweepstakes draw, verify score proof uploads, and release cash prizes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadWinners}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              <svg className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </button>
            <Link
              href="/admin/draw"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              🎲 Draw Controller
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              ← Command Center
            </Link>
          </div>
        </div>

        {/* 4 Winning KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-[#0b101b]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Winners
              </span>
              <span className="text-sm">🏆</span>
            </div>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              {winners.length}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Qualified across all draws
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-[#0b101b]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Prize Money Awarded
              </span>
              <span className="text-sm">💰</span>
            </div>
            <p className="mt-3 text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              ₹{totalPrizeAwarded.toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              5-Match, 4-Match & 3-Match pools
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-[#0b101b]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Verified Winners
              </span>
              <span className="text-sm">✅</span>
            </div>
            <p className="mt-3 text-3xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">
              {approvedCount} / {winners.length}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Proof screenshot approved
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-[#0b101b]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Payout Status
              </span>
              <span className="text-sm">💳</span>
            </div>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              {paidCount} Paid
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {winners.length - paidCount} pending release
            </p>
          </div>
        </div>

        {actionMessage && (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            {actionMessage}
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(["all", "pending", "approved", "rejected"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold capitalize transition cursor-pointer ${
                  filter === status
                    ? "bg-slate-950 text-white dark:bg-emerald-600 dark:text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                }`}
              >
                {status === "all" ? `All Status (${winners.length})` : `${status} (${winners.filter((w) => w.verification_status === status).length})`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => setTierFilter("all")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                tierFilter === "all"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
              }`}
            >
              All Tiers
            </button>
            <button
              onClick={() => setTierFilter("5_match")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                tierFilter === "5_match"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
              }`}
            >
              🌟 5-Match
            </button>
            <button
              onClick={() => setTierFilter("4_match")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                tierFilter === "4_match"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
              }`}
            >
              ⭐ 4-Match
            </button>
            <button
              onClick={() => setTierFilter("3_match")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                tierFilter === "3_match"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
              }`}
            >
              🥉 3-Match
            </button>
          </div>
        </div>

        {/* Winners List / Table */}
        <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-[#0b101b] overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-slate-500">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mb-2" />
              Loading winning history...
            </div>
          ) : filteredWinners.length === 0 ? (
            <div className="p-16 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-2xl">
                🏆
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No winners found in this view
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Run the monthly draw in the Draw Controller to scan submitted golf scores and award Jackpot, 4-Match, and 3-Match prizes.
              </p>
              <Link
                href="/admin/draw"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-500 shadow-sm"
              >
                Go to Draw Controller 🎲 &rarr;
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200/80 bg-slate-50/70 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800/80 dark:bg-slate-900/50 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Winner Golfer</th>
                    <th className="px-6 py-4">Draw Month</th>
                    <th className="px-6 py-4">Tier / Matches</th>
                    <th className="px-6 py-4">Cash Prize</th>
                    <th className="px-6 py-4">Score Proof Screenshot</th>
                    <th className="px-6 py-4">Verification</th>
                    <th className="px-6 py-4">Payout</th>
                    <th className="px-6 py-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filteredWinners.map((winner) => (
                    <tr key={winner.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-950 dark:text-white">
                          {winner.full_name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          ID: {winner.user_id.slice(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-300">
                        {winner.draw_month || "Current Month"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                            winner.match_type === "5_match"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                              : winner.match_type === "4_match"
                              ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                          }`}
                        >
                          {winner.match_type === "5_match"
                            ? "🌟 5 Match (Jackpot)"
                            : winner.match_type === "4_match"
                            ? "⭐ 4 Match"
                            : "🥉 3 Match"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                          ₹{Number(winner.prize_amount).toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {winner.proof?.signedUrl ? (
                          <button
                            type="button"
                            onClick={() => setSelectedProofUrl(winner.proof?.signedUrl || null)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300 cursor-pointer"
                          >
                            <span>🖼️ View Proof</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            No proof uploaded yet
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${
                            winner.verification_status === "approved"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                              : winner.verification_status === "rejected"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400"
                          }`}
                        >
                          {winner.verification_status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${
                            winner.payout_status === "paid"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {winner.payout_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {winner.verification_status !== "approved" && (
                            <button
                              type="button"
                              disabled={updatingId === winner.id}
                              onClick={() => updateWinnerStatus(winner.id, "approved", "paid")}
                              className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-xs cursor-pointer disabled:opacity-50"
                            >
                              {updatingId === winner.id ? "Updating..." : "Approve ✓"}
                            </button>
                          )}
                          {winner.verification_status !== "rejected" && (
                            <button
                              type="button"
                              disabled={updatingId === winner.id}
                              onClick={() => updateWinnerStatus(winner.id, "rejected", "pending")}
                              className="rounded-xl border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-950/30 cursor-pointer disabled:opacity-50"
                            >
                              Reject ✗
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Lightbox Modal for Proof Screenshot */}
        {selectedProofUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative max-h-[90vh] max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Scorecard Proof Screenshot Verification
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedProofUrl(null)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 flex items-center justify-center max-h-[75vh] overflow-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedProofUrl}
                  alt="Golf score proof"
                  className="max-h-full max-w-full rounded-2xl object-contain shadow-md"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
