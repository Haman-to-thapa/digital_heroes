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
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const now = new Date();
      const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;

      const [profileRes, scoreRes, drawRes] = await Promise.all([
        supabase.from("profiles").select("role").eq("id", user.id).single(),
        supabase
          .from("scores")
          .select("score, score_date")
          .eq("user_id", user.id)
          .order("score_date", { ascending: false })
          .limit(5),
        supabase
          .from("draws")
          .select("id")
          .eq("draw_month", currentMonth)
          .maybeSingle(),
      ]);

      const profileData = profileRes.data;
      if (profileData?.role) {
        setUserRole(profileData.role);
        if (profileData.role === "admin") {
          router.replace("/admin/draw");
          return;
        }
      }

      if (scoreRes.error) {
        setMessage(scoreRes.error.message);
        setLoading(false);
        return;
      }

      setScores(scoreRes.data || []);

      const draw = drawRes.data;
      if (draw) {
        const { data: existingEntry } = await supabase
          .from("draw_entries")
          .select("id")
          .eq("draw_id", draw.id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (existingEntry) {
          setHasEntered(true);
        }
      }

      setLoading(false);
    }

    loadData();
  }, [router, supabase]);

  async function handleEnterDraw() {
    setMessage("");
    setIsSuccess(false);
    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    // Check user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";

    // Non-admin users must have an active subscription
    if (!isAdmin) {
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!subscription) {
        setMessage("An active subscription is required to enter the draw.");
        setIsSuccess(false);
        setSubmitting(false);
        return;
      }
    }

    if (scores.length !== 5) {
      setMessage("You need exactly 5 scores to enter the draw.");
      setIsSuccess(false);
      setSubmitting(false);
      return;
    }

    // Get current month's draw
    const now = new Date();
    const drawMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;

    const { data: draw, error: drawError } = await supabase
      .from("draws")
      .select("id, status")
      .eq("draw_month", drawMonth)
      .maybeSingle();

    if (drawError) {
      setMessage(drawError.message);
      setIsSuccess(false);
      setSubmitting(false);
      return;
    }

    if (!draw) {
      setMessage("Current monthly draw is not available.");
      setIsSuccess(false);
      setSubmitting(false);
      return;
    }

    if (draw.status !== "draft" && draw.status !== "simulated") {
      setMessage("This draw is not open for entries.");
      setIsSuccess(false);
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("draw_entries").insert({
      draw_id: draw.id,
      user_id: user.id,
      number_1: scores[0].score,
      number_2: scores[1].score,
      number_3: scores[2].score,
      number_4: scores[3].score,
      number_5: scores[4].score,
      matches_count: 0,
    });

    if (error) {
      if (error.code === "23505") {
        setMessage("You have already entered this draw.");
        setHasEntered(true);
      } else {
        setMessage(error.message);
      }
      setIsSuccess(false);
      setSubmitting(false);
      return;
    }

    setIsSuccess(true);
    setHasEntered(true);
    setMessage("You have successfully entered the current draw.");
    setSubmitting(false);
  }

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
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              MONTHLY DRAW
            </p>
            {hasEntered && (
              <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Entered
              </span>
            )}
          </div>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Your Draw Entry
          </h1>

          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Your latest five Stableford scores will be used for the current draw entry.
          </p>

          {/* No admin banner here — admin is redirected to /admin/draw on load */}

          {message && (
            <div
              className={`mt-4 rounded-xl border p-4 text-sm font-medium ${
                isSuccess
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400"
              }`}
            >
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
                  {hasEntered
                    ? "You are registered in the current monthly draw with your 5 numbers."
                    : "Ready for the monthly draw."}
                </p>

                <button
                  type="button"
                  onClick={handleEnterDraw}
                  disabled={submitting}
                  className="mt-5 rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400 cursor-pointer disabled:opacity-50"
                >
                  {submitting
                    ? "Submitting Entry..."
                    : hasEntered
                    ? "Enter Current Draw Again"
                    : "Enter Current Draw"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
