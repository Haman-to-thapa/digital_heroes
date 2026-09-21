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

    // Score validation
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
      // Unique constraint catches duplicate date
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

    // Keep only latest 5
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
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 font-medium">Loading scores...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* Add Score */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">
            Golf Scores
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Add your latest Stableford score.
          </p>

          <form
            onSubmit={handleAddScore}
            className="mt-6 grid gap-4 md:grid-cols-3"
          >
            <input
              type="number"
              min="1"
              max="45"
              placeholder="Score (1-45)"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              required
              className="rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-black"
            />

            <input
              type="date"
              value={scoreDate}
              onChange={(e) => setScoreDate(e.target.value)}
              required
              className="rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-black"
            />

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-black px-4 py-3 font-medium text-white transition hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Adding..." : "Add Score"}
            </button>
          </form>

          {message && (
            <p className={`mt-4 text-sm font-medium ${message.includes("successfully") ? "text-green-600" : "text-red-600"}`}>
              {message}
            </p>
          )}
        </div>

        {/* Score List */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Your Scores
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Latest 5 scores only
              </p>
            </div>

            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
              {scores.length}/5
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {scores.length === 0 ? (
              <p className="text-gray-500">
                No scores added yet.
              </p>
            ) : (
              scores.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-gray-200 p-4 transition hover:shadow-sm"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      Score #{index + 1}
                    </p>

                    <p className="text-sm text-gray-500">
                      {item.score_date}
                    </p>
                  </div>

                  <div className="text-2xl font-bold text-black">
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
