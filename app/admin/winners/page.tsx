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
  const [payoutFilter, setPayoutFilter] = useState<"all" | "pending" | "paid">("all");
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [selectedProofWinner, setSelectedProofWinner] = useState<Winner | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function loadWinners() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/winners");
      const data = await res.json();
      if (res.ok) setWinners(data.winners || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadWinners(); }, []);

  // Step 64 — Approve or Reject winner proof via dedicated verify endpoint
  async function verifyWinner(winnerId: string, action: "approve" | "reject") {
    setUpdatingId(winnerId);
    setActionMessage(null);
    const reviewNote =
      action === "approve" ? "Proof approved by admin." : "Proof rejected by admin.";
    try {
      const res = await fetch(`/api/admin/winners/${winnerId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reviewNote }),
      });
      const data = await res.json();
      if (res.ok) {
        const msg =
          action === "approve"
            ? "Winner proof approved ✅ — payout is now Pending"
            : "Winner proof rejected ✗";
        setActionMessage({ text: msg, ok: true });
        await loadWinners();
        // Update lightbox state inline so modal reflects new status immediately
        setSelectedProofWinner((prev) =>
          prev?.id === winnerId
            ? { ...prev, verification_status: action === "approve" ? "approved" : "rejected" }
            : prev
        );
      } else {
        setActionMessage({ text: data.error || "Verification failed.", ok: false });
      }
    } catch {
      setActionMessage({ text: "Network error during verification.", ok: false });
    } finally {
      setUpdatingId(null);
    }
  }

  // Step 65 (upcoming) — Mark payout as Paid via original PATCH endpoint
  async function markPaid(winnerId: string) {
    setUpdatingId(winnerId);
    setActionMessage(null);
    try {
      const res = await fetch("/api/admin/winners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerId, payout_status: "paid" }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ text: "Payout marked as Paid 💰 — funds released!", ok: true });
        await loadWinners();
        setSelectedProofWinner((prev) =>
          prev?.id === winnerId ? { ...prev, payout_status: "paid" } : prev
        );
      } else {
        setActionMessage({ text: data.error || "Failed to mark payout.", ok: false });
      }
    } catch {
      setActionMessage({ text: "Network error marking payout.", ok: false });
    } finally {
      setUpdatingId(null);
    }
  }


  const filteredWinners = winners.filter((w) => {
    const matchesVerif = filter === "all" ? true : w.verification_status === filter;
    const matchesPayout = payoutFilter === "all" ? true : w.payout_status === payoutFilter;
    return matchesVerif && matchesPayout;
  });

  const totalPrize = winners.reduce((a, c) => a + Number(c.prize_amount || 0), 0);
  const approvedCount = winners.filter((w) => w.verification_status === "approved").length;
  const paidCount = winners.filter((w) => w.payout_status === "paid").length;
  const proofCount = winners.filter((w) => w.proof).length;
  const awaitingProof = winners.filter((w) => !w.proof && w.verification_status === "pending").length;
  const pendingPayout = winners.filter((w) => w.verification_status === "approved" && w.payout_status === "pending").length;

  const tierLabel = (mt: string) =>
    mt === "5_match" ? "🌟 5-Match Jackpot" : mt === "4_match" ? "⭐ 4-Match" : "🥉 3-Match";

  const tierCls = (mt: string) =>
    mt === "5_match"
      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
      : mt === "4_match"
      ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700"
      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700";

  const verifCls = (s: string) =>
    s === "approved"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
      : s === "rejected"
      ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400"
      : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400";

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-[#070b12] text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-6 dark:border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                👑 Admin Control Center
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Winner Verification & Payouts</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              Winner Verification & Payout Control 🏆
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Review uploaded score proof screenshots, approve or reject, and release cash payouts.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={loadWinners}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 cursor-pointer"
            >
              <svg className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <Link href="/admin/draw" className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              🎲 Draw Controller
            </Link>
            <Link href="/dashboard" className="rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-amber-500">
              ← Command Center
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Total Winners", val: String(winners.length), sub: "All draws", icon: "🏆", cls: "text-slate-950 dark:text-white" },
            { label: "Prize Total", val: `₹${totalPrize.toLocaleString("en-IN")}`, sub: "Jackpot + 4M + 3M", icon: "💰", cls: "text-emerald-600 dark:text-emerald-400" },
            { label: "Proof Uploaded", val: String(proofCount), sub: `${awaitingProof} awaiting`, icon: "📤", cls: "text-indigo-600 dark:text-indigo-400" },
            { label: "Verified", val: `${approvedCount} / ${winners.length}`, sub: "Approved screenshots", icon: "✅", cls: "text-indigo-600 dark:text-indigo-400" },
            { label: "Payouts Released", val: `${paidCount} Paid`, sub: `${pendingPayout} pending release`, icon: "💳", cls: "text-slate-950 dark:text-white" },
          ].map((k) => (
            <div key={k.label} className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-[#0b101b]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{k.label}</span>
                <span>{k.icon}</span>
              </div>
              <p className={`mt-3 text-2xl font-black tracking-tight ${k.cls}`}>{k.val}</p>
              <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Flow Banner */}
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50/60 px-5 py-4 dark:border-amber-900/30 dark:bg-amber-950/20">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
            <span className="font-black text-amber-900 dark:text-amber-200">Verification Flow:</span>
            {["Winner declared", "User uploads proof", "Admin views screenshot", "Approve → Payout Pending", "Mark Paid → Released"].map((s, i, a) => (
              <span key={s} className="flex items-center gap-1.5">
                <span className="rounded-full bg-amber-200/80 px-2 py-0.5 dark:bg-amber-900/50">{s}</span>
                {i < a.length - 1 && <span className="text-amber-500">→</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Action feedback */}
        {actionMessage && (
          <div className={`rounded-2xl border px-5 py-3 text-xs font-bold ${
            actionMessage.ok
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
              : "border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-300"
          }`}>
            {actionMessage.text}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Verification:</span>
            {(["all", "pending", "approved", "rejected"] as const).map((s) => (
              <button key={s} onClick={() => setFilter(s)} className={`rounded-xl px-3.5 py-1.5 text-xs font-bold capitalize cursor-pointer transition ${filter === s ? "bg-slate-950 text-white dark:bg-amber-600" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"}`}>
                {s === "all" ? `All (${winners.length})` : `${s} (${winners.filter((w) => w.verification_status === s).length})`}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Payout:</span>
            {(["all", "pending", "paid"] as const).map((s) => (
              <button key={s} onClick={() => setPayoutFilter(s)} className={`rounded-xl px-3.5 py-1.5 text-xs font-bold capitalize cursor-pointer transition ${payoutFilter === s ? (s === "paid" ? "bg-emerald-600 text-white" : "bg-slate-950 text-white dark:bg-amber-600") : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"}`}>
                {s === "all" ? `All (${winners.length})` : `${s} (${winners.filter((w) => w.payout_status === s).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-[#0b101b] overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-slate-500">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mb-3" />
              Loading winning history...
            </div>
          ) : filteredWinners.length === 0 ? (
            <div className="p-16 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-2xl">🏆</div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No winners found</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">Run the monthly draw to generate winners.</p>
              <Link href="/admin/draw" className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-extrabold text-white hover:bg-amber-500 shadow-sm">
                Go to Draw Controller 🎲 →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200/80 bg-slate-50/70 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-800/80 dark:bg-slate-900/50 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-4">Winner</th>
                    <th className="px-5 py-4">Draw Month</th>
                    <th className="px-5 py-4">Tier</th>
                    <th className="px-5 py-4">Prize</th>
                    <th className="px-5 py-4">Proof</th>
                    <th className="px-5 py-4">Verification</th>
                    <th className="px-5 py-4">Payout</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredWinners.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-950 dark:text-white">{w.full_name}</div>
                        <div className="text-[10px] font-mono text-slate-400">ID: {w.user_id.slice(0, 8)}…</div>
                      </td>
                      <td className="px-5 py-4 text-xs font-bold text-slate-600 dark:text-slate-300">
                        {w.draw_month ? new Date(w.draw_month).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "Current"}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold ${tierCls(w.match_type)}`}>
                          {tierLabel(w.match_type)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">₹{Number(w.prize_amount).toLocaleString("en-IN")}</span>
                      </td>
                      <td className="px-5 py-4">
                        {w.proof?.signedUrl ? (
                          <button
                            type="button"
                            onClick={() => { setSelectedProofUrl(w.proof?.signedUrl || null); setSelectedProofWinner(w); }}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300 cursor-pointer transition"
                          >
                            🖼️ View Proof
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                            ⏳ Awaiting Upload
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${verifCls(w.verification_status)}`}>
                          {w.verification_status === "approved" ? "✅ Approved" : w.verification_status === "rejected" ? "✗ Rejected" : "⏳ Pending"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${w.payout_status === "paid" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>
                          {w.payout_status === "paid" ? "💰 Paid" : "🕐 Pending"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {/* Approve — calls /[id]/verify endpoint (Step 64) */}
                          {w.verification_status === "pending" && w.proof && (
                            <button type="button" disabled={updatingId === w.id} onClick={() => verifyWinner(w.id, "approve")}
                              className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 cursor-pointer disabled:opacity-50 transition">
                              {updatingId === w.id ? "…" : "Approve ✓"}
                            </button>
                          )}
                          {/* Reject — calls /[id]/verify endpoint (Step 64) */}
                          {w.verification_status === "pending" && (
                            <button type="button" disabled={updatingId === w.id} onClick={() => verifyWinner(w.id, "reject")}
                              className="rounded-xl border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:bg-slate-900 dark:text-rose-400 cursor-pointer disabled:opacity-50 transition">
                              Reject ✗
                            </button>
                          )}
                          {/* Mark Paid — Step 65, calls /api/admin/winners PATCH */}
                          {w.verification_status === "approved" && w.payout_status === "pending" && (
                            <button type="button" disabled={updatingId === w.id} onClick={() => markPaid(w.id)}
                              className="rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-500 cursor-pointer disabled:opacity-50 transition">
                              {updatingId === w.id ? "…" : "💰 Mark Paid"}
                            </button>
                          )}
                          {/* Re-approve after rejection if proof exists */}
                          {w.verification_status === "rejected" && w.proof && (
                            <button type="button" disabled={updatingId === w.id} onClick={() => verifyWinner(w.id, "approve")}
                              className="rounded-xl border border-emerald-500/60 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 cursor-pointer disabled:opacity-50 transition">
                              Re-approve
                            </button>
                          )}
                          {/* Fully settled */}
                          {w.verification_status === "approved" && w.payout_status === "paid" && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">✅ Settled</span>
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
      </div>

      {/* Lightbox */}
      {selectedProofUrl && selectedProofWinner && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setSelectedProofUrl(null); setSelectedProofWinner(null); } }}
        >
          <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
            {/* Lightbox Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-extrabold ${tierCls(selectedProofWinner.match_type)}`}>
                    {tierLabel(selectedProofWinner.match_type)}
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedProofWinner.full_name}</span>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  Prize: <span className="font-black text-emerald-600 dark:text-emerald-400">₹{Number(selectedProofWinner.prize_amount).toLocaleString("en-IN")}</span>
                  {" · "}Uploaded: {selectedProofWinner.proof?.created_at ? new Date(selectedProofWinner.proof.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                </p>
              </div>
              <button type="button" onClick={() => { setSelectedProofUrl(null); setSelectedProofWinner(null); }}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 cursor-pointer transition">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Screenshot */}
            <div className="flex items-center justify-center max-h-[55vh] overflow-auto bg-slate-50 p-6 dark:bg-slate-950/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedProofUrl} alt="Golf score proof screenshot" className="max-h-full max-w-full rounded-2xl object-contain shadow-md" />
            </div>

            {/* Action footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex items-center gap-2">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${verifCls(selectedProofWinner.verification_status)}`}>
                  {selectedProofWinner.verification_status === "approved" ? "✅ Verified" : selectedProofWinner.verification_status === "rejected" ? "✗ Rejected" : "⏳ Pending Review"}
                </span>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${selectedProofWinner.payout_status === "paid" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>
                  {selectedProofWinner.payout_status === "paid" ? "💰 Paid" : "🕐 Payout Pending"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {selectedProofWinner.verification_status === "pending" && (
                  <>
                    <button type="button" disabled={updatingId === selectedProofWinner.id}
                      onClick={() => verifyWinner(selectedProofWinner.id, "approve")}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 cursor-pointer disabled:opacity-50 transition">
                      {updatingId === selectedProofWinner.id ? "Updating…" : "Approve Proof ✓"}
                    </button>
                    <button type="button" disabled={updatingId === selectedProofWinner.id}
                      onClick={() => verifyWinner(selectedProofWinner.id, "reject")}
                      className="rounded-xl border border-rose-300 bg-white px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:bg-slate-900 dark:text-rose-400 cursor-pointer disabled:opacity-50 transition">
                      Reject ✗
                    </button>
                  </>
                )}
                {selectedProofWinner.verification_status === "rejected" && (
                  <button type="button" disabled={updatingId === selectedProofWinner.id}
                    onClick={() => verifyWinner(selectedProofWinner.id, "approve")}
                    className="rounded-xl border border-emerald-500/60 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 cursor-pointer disabled:opacity-50 transition">
                    Re-approve
                  </button>
                )}
                {selectedProofWinner.verification_status === "approved" && selectedProofWinner.payout_status === "pending" && (
                  <button type="button" disabled={updatingId === selectedProofWinner.id}
                    onClick={() => markPaid(selectedProofWinner.id)}
                    className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-500 cursor-pointer disabled:opacity-50 transition">
                    {updatingId === selectedProofWinner.id ? "Processing…" : "💰 Mark as Paid"}
                  </button>
                )}
                {selectedProofWinner.verification_status === "approved" && selectedProofWinner.payout_status === "paid" && (
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">✅ All done — Payout Released</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
