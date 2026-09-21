"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function fetchScores() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("scores")
      .select("id, score, score_date")
      .eq("user_id", user.id)
      .order("score_date", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setScores(data || []);
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

    // Date validation
    if (!scoreDate) {
      setMessage("Please select a date.");
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    // Insert score
    const { error } = await supabase.from("scores").insert({
      user_id: user.id,
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
      .eq("user_id", user.id)
      .order("score_date", { ascending: false });

    if (fetchError) {
      setMessage(fetchError.message);
      setSaving(false);
      return;
    }

    // PRD: Retain latest 5 only, delete older ones
    if (updatedScores && updatedScores.length > 5) {
      const scoresToDelete = updatedScores.slice(5);

      for (const oldScore of scoresToDelete) {
        await supabase
          .from("scores")
          .delete()
          .eq("id", oldScore.id)
          .eq("user_id", user.id);
      }
    }

    setScore("");
    setScoreDate("");
    setMessage("Score added successfully.");

    await fetchScores();
    setSaving(false);
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
        {/* Add Score Card */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                Golf Scores ⛳
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Add your latest Stableford score (Range: 1 – 45).
              </p>
            </div>
            <span className="hidden sm:inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              PRD Validated
            </span>
          </div>

          <form
            onSubmit={handleAddScore}
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

            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Adding..." : "+ Add Score"}
              </button>
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
                Latest 5 scores retained (Newest first)
              </p>
            </div>

            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {scores.length} / 5 slots
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {scores.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                No scores added yet. Enter your first score above!
              </div>
            ) : (
              scores.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-gray-200/70 bg-gray-50/50 p-4 transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40 dark:hover:bg-gray-800/70"
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

                  <div className="text-2xl font-black text-gray-900 dark:text-white">
                    {item.score}
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
