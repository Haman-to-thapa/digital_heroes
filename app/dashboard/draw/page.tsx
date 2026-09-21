"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Score = {
  score: number;
  score_date: string;
};

export default function DrawPage() {
  const supabase = createClient();
  const router = useRouter();

  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadScores() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("scores")
        .select("score, score_date")
        .eq("user_id", user.id)
        .order("score_date", { ascending: false })
        .limit(5);

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setScores(data || []);
      setLoading(false);
    }

    loadScores();
  }, [router, supabase]);

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 font-medium">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <span>Loading draw entry...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            MONTHLY DRAW
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Your Draw Entry
          </h1>

          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Your latest five Stableford scores will be used for the current draw entry.
          </p>

          {message && (
            <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
              {message}
            </div>
          )}

          {scores.length < 5 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 p-6 text-center dark:border-gray-700 dark:bg-gray-800/40">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 text-xl font-bold">
                ⛳
              </div>
              <h2 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">
                Add 5 scores first
              </h2>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                You currently have <span className="font-semibold text-gray-900 dark:text-white">{scores.length}</span> of 5 required scores.
              </p>

              <div className="mt-6">
                <Link
                  href="/dashboard/scores"
                  className="inline-flex items-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
                >
                  Go to Scores →
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-8">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                  Your 5 Qualified Numbers
                </p>
                <div className="grid grid-cols-5 gap-3">
                  {scores.map((item, index) => (
                    <div
                      key={`${item.score_date}-${index}`}
                      className="rounded-2xl border border-gray-200/80 bg-gray-50 p-4 text-center dark:border-gray-800 dark:bg-gray-800/60"
                    >
                      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                        #{index + 1}
                      </p>

                      <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                        {item.score}
                      </p>

                      <p className="mt-1 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                        {item.score_date}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-gray-200/80 bg-gray-50/50 p-6 dark:border-gray-800 dark:bg-gray-800/30">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Entry status
                </h2>

                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Ready for the monthly draw.
                </p>

                <button
                  type="button"
                  className="mt-5 rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400 cursor-pointer"
                >
                  Enter Current Draw
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
