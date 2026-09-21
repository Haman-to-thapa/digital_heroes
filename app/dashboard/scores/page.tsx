"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Score = {
  id: string;
  score: number;
  score_date: string;
};

export default function ScoresPage() {
  const supabase = createClient();
  const router = useRouter();

  const [scores, setScores] = useState<Score[]>([]);
  const [score, setScore] = useState("");
  const [scoreDate, setScoreDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [userRole, setUserRole] = useState("user");
  const [userId, setUserId] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Fetch scores without resetting the full loading state (avoids page re-render)
  async function refreshScores(uid: string) {
    const { data, error } = await supabase
      .from("scores")
      .select("id, score, score_date")
      .eq("user_id", uid)
      .order("score_date", { ascending: false });

    if (!error) {
      setScores(data || []);
    }
  }

  async function fetchScores() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setUserId(user.id);

    const [profileRes, scoresRes, subRes] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).single(),
      supabase
        .from("scores")
        .select("id, score, score_date")
        .eq("user_id", user.id)
        .order("score_date", { ascending: false }),
      supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle(),
    ]);

    if (profileRes.data?.role) {
      setUserRole(profileRes.data.role);
    }

    const isVip = !!subRes.data || profileRes.data?.role === "admin";
    setIsSubscribed(isVip);

    if (scoresRes.error) {
      setMessage(scoresRes.error.message);
      setLoading(false);
      return;
    }

    setScores(scoresRes.data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchScores();
  }, []);

  async function handleAddScore(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    const numericScore = Number(score);

    // Score validation (PRD: 1-45 Stableford score)
    if (!Number.isInteger(numericScore) || numericScore < 1 || numericScore > 45) {
      setMessage("Score must be between 1 and 45.");
      return;
    }

    if (!scoreDate) {
      setMessage("Please select a date.");
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const uid = userId || user?.id;
    if (!uid) {
      router.push("/login");
      return;
    }

    // Insert score
    const { error } = await supabase.from("scores").insert({
      user_id: uid,
      score: numericScore,
      score_date: scoreDate,
    });

    if (error) {
      if (error.code === "23505") {
        setMessage("You already have a score for this date.");
      } else {
        setMessage(error.message);
      }
      setSaving(false);
      return;
    }

    // Fetch all scores after adding
    const { data: updatedScores, error: fetchError } = await supabase
      .from("scores")
      .select("id, score, score_date")
      .eq("user_id", uid)
      .order("score_date", { ascending: false });

    if (fetchError) {
      setMessage(fetchError.message);
      setSaving(false);
      return;
    }

    // PRD & VIP Tier Rule: Retain latest maxAllowed only (10 for VIP Hero, 5 for Standard)
    const maxAllowed = isSubscribed || userRole === "admin" ? 10 : 5;
    if (updatedScores && updatedScores.length > maxAllowed) {
      const scoresToDelete = updatedScores.slice(maxAllowed);
      for (const oldScore of scoresToDelete) {
        await supabase
          .from("scores")
          .delete()
          .eq("id", oldScore.id)
          .eq("user_id", uid);
      }
    }

    setScore("");
    setScoreDate("");
    setMessage("Score added successfully.");
    // Refresh only the scores list — no full page reload
    await refreshScores(uid);
    setSaving(false);
  }

  async function handleUpdateScore(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingId) return;

    setMessage("");

    const numericScore = Number(score);

    if (!Number.isInteger(numericScore) || numericScore < 1 || numericScore > 45) {
      setMessage("Score must be between 1 and 45.");
      return;
    }

    if (!scoreDate) {
      setMessage("Please select a date.");
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const uid = userId || user?.id;
    if (!uid) {
      router.push("/login");
      return;
    }

    const { error } = await supabase
      .from("scores")
      .update({
        score: numericScore,
        score_date: scoreDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingId)
      .eq("user_id", uid);

    if (error) {
      if (error.code === "23505") {
        setMessage("You already have a score for this date.");
      } else {
        setMessage(error.message);
      }
      setSaving(false);
      return;
    }

    setEditingId(null);
    setScore("");
    setScoreDate("");
    setMessage("Score updated successfully.");
    // Refresh only the scores list — no full page reload
    await refreshScores(uid);
    setSaving(false);
  }

  function startEdit(item: Score) {
    setEditingId(item.id);
    setScore(String(item.score));
    setScoreDate(item.score_date);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setScore("");
    setScoreDate("");
    setMessage("");
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Are you sure you want to delete this score?");
    if (!confirmed) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const uid = userId || user?.id;
    if (!uid) {
      router.push("/login");
      return;
    }

    const { error } = await supabase
      .from("scores")
      .delete()
      .eq("id", id)
      .eq("user_id", uid);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (editingId === id) {
      cancelEdit();
    }

    setMessage("Score deleted successfully.");
    await refreshScores(uid);
  }

  if (loading) {
    return (
      <main className="min-h-[80vh] flex items-center justify-center">
        <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 font-medium">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <span>Loading scores...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Administrator Dedicated Notice */}
        {userRole === "admin" && (
          <div className="overflow-hidden rounded-2xl border-2 border-amber-500/80 bg-amber-500/10 p-5 dark:border-amber-500/50 dark:bg-amber-950/40">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-black uppercase text-slate-950">
                  👑 Admin Role
                </span>
                <h3 className="mt-1 text-base font-bold text-slate-950 dark:text-white">
                  Looking to run the Monthly Draw?
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Golfers use this page to submit 5 Stableford scores. As an Admin, you do not need to log personal scores—manage the monthly sweepstakes in the Draw Controller.
                </p>
              </div>
              <Link
                href="/admin/draw"
                className="rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-amber-500 shrink-0 shadow-sm"
              >
                Go to Draw Controller 🎲 &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* VIP Hero 10-Score Capacity & Analytics Banner */}
        {isSubscribed || userRole === "admin" ? (
          <div className="overflow-hidden rounded-3xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-emerald-500/10 to-teal-500/5 p-6 shadow-sm dark:border-amber-500/30 dark:bg-[#0c121e]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-amber-500/20 to-emerald-500/20 px-3 py-0.5 text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-xs">
                    <span>⭐</span> VIP HERO BENEFIT
                  </span>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                    10-Score Capacity Active ✓
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
                  VIP 10-Round Performance & Draw Slots
                </h2>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                  As an active VIP Hero, you can store up to <strong>10 golf scores</strong> (Standard users are limited to 5). This lets you track your handicap trends, save more course rounds, and maximize your chances in the monthly sweepstakes draw!
                </p>
              </div>

              <div className="shrink-0 flex sm:flex-col items-end gap-1.5">
                <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {scores.length} <span className="text-lg font-bold text-slate-400">/ 10</span>
                </span>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  VIP Slots Used
                </span>
              </div>
            </div>

            {/* 4 VIP Analytics Metrics */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
              <div className="rounded-xl bg-white/70 p-3 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Rounds Logged</span>
                <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">{scores.length} / 10</p>
              </div>
              <div className="rounded-xl bg-white/70 p-3 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Average Score</span>
                <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {scores.length > 0 ? (scores.reduce((a, b) => a + b.score, 0) / scores.length).toFixed(1) : "—"} pts
                </p>
              </div>
              <div className="rounded-xl bg-white/70 p-3 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Personal Best</span>
                <p className="text-base font-black text-amber-600 dark:text-amber-400 mt-0.5">
                  {scores.length > 0 ? Math.max(...scores.map((s) => s.score)) : "—"} pts
                </p>
              </div>
              <div className="rounded-xl bg-white/70 p-3 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Jackpot Entry</span>
                <p className="text-base font-black text-purple-600 dark:text-purple-400 mt-0.5">
                  {scores.length >= 5 ? "Eligible (5+ Scores) ✅" : `Needs ${5 - scores.length} more`}
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Standard User Upgrade Prompt */
          <div className="overflow-hidden rounded-2xl border border-amber-300 bg-amber-50/70 p-5 dark:border-amber-900/50 dark:bg-amber-950/30">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-lg">
                  ⭐
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-amber-950 dark:text-amber-200">
                      Standard Limit: 5 Scores (Upgrade for 10 Scores)
                    </h3>
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-extrabold text-amber-800 dark:text-amber-300">
                      VIP Hero
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                    Free accounts can save up to 5 golf rounds. Subscribe to VIP Hero (₹100/mo) to unlock <strong>10 score slots</strong>, handicap analytics, and monthly jackpot draws!
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard/subscription"
                className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-amber-500 shrink-0"
              >
                ⭐ Unlock 10 Scores &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Form Card (Add / Edit) */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                {editingId ? "Edit Golf Score ✏️" : "Golf Scores ⛳"}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {editingId
                  ? "Modify your existing score and date."
                  : "Add your latest Stableford score (Range: 1 – 45)."}
              </p>
            </div>
            {editingId && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
                Editing Mode
              </span>
            )}
          </div>

          <form
            onSubmit={editingId ? handleUpdateScore : handleAddScore}
            className="mt-6 grid gap-4 sm:grid-cols-3"
          >
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Score (1–45)
              </label>
              <input
                type="number"
                min="1"
                max="45"
                placeholder="e.g. 36"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Score Date
              </label>
              <input
                type="date"
                value={scoreDate}
                onChange={(e) => setScoreDate(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-emerald-400"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 cursor-pointer"
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Score"
                  : "+ Add Score"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-xl border border-gray-300 px-4 py-2.5 font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {message && (
            <div
              className={`mt-4 rounded-xl p-3 text-sm font-medium ${
                message.includes("successfully")
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900"
                  : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900"
              }`}
            >
              {message}
            </div>
          )}
        </div>

        {/* Score List Card */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Your Scores
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isSubscribed || userRole === "admin"
                  ? "Latest 10 scores retained (VIP Hero Tier • Newest first)"
                  : "Latest 5 scores retained (Standard Tier • Newest first)"}
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                isSubscribed || userRole === "admin"
                  ? "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-500/30 font-bold"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {scores.length} / {isSubscribed || userRole === "admin" ? 10 : 5} slots
            </span>
          </div>

          {!isSubscribed && userRole !== "admin" && scores.length >= 5 && (
            <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50/80 p-3.5 dark:border-amber-900/50 dark:bg-amber-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-amber-900 dark:text-amber-200">
                <span className="font-extrabold">All 5 Standard slots filled.</span> Upgrading to <strong>VIP Hero</strong> will unlock <strong>10 score slots</strong> and track your full handicap history!
              </div>
              <Link
                href="/dashboard/subscription"
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-extrabold text-white shrink-0 hover:bg-amber-500 text-center"
              >
                Upgrade to 10 Slots (₹100/mo) &rarr;
              </Link>
            </div>
          )}

          <div className="mt-4 space-y-3">
            {scores.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                No scores added yet. Enter your first score above!
              </div>
            ) : (
              scores.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border p-4 transition ${
                    editingId === item.id
                      ? "border-emerald-500 bg-emerald-50/40 dark:border-emerald-500/80 dark:bg-emerald-950/20"
                      : "border-gray-200/70 bg-gray-50/50 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40 dark:hover:bg-gray-800/70"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        Stableford Score
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Date: {item.score_date}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-2xl font-black text-gray-900 dark:text-white">
                      {item.score}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(item)}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900/60 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-950/40 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
