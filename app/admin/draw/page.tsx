"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AdminDrawPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");
  const [numbers, setNumbers] = useState<number[]>([]);
  const [drawStatus, setDrawStatus] = useState<string>("draft");
  const [publishedAt, setPublishedAt] = useState<string | null>(null);

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
      }
    }

    loadCurrentDraw();
  }, [supabase]);

  async function simulateDraw() {
    setLoading(true);
    setMessage("");
    setNumbers([]);

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
            Draw Simulation & Publishing
          </h1>

          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Run a simulation to generate 5 winning numbers, then officially publish the monthly draw.
          </p>

          {publishedAt && (
            <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Published on: {new Date(publishedAt).toLocaleString()}
            </p>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={simulateDraw}
              disabled={loading || drawStatus === "published"}
              className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400 cursor-pointer"
            >
              {loading ? "Simulating..." : "Simulate Draw"}
            </button>

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
                  ? "Draw Published ✓"
                  : "Publish Draw"}
              </button>
            )}
          </div>

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
