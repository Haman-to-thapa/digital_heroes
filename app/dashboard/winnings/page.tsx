"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Winner = {
  id: string;
  match_type: string;
  prize_amount: number;
  verification_status: string;
  payout_status: string;
  created_at: string;
};

export default function WinningsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [winnings, setWinnings] = useState<Winner[]>([]);
  const [totalWon, setTotalWon] = useState(0);
  const [loading, setLoading] = useState(true);

  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  async function loadWinnings() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("winners")
      .select(
        "id, match_type, prize_amount, verification_status, payout_status, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching winnings:", error);
      setLoading(false);
      return;
    }

    const winnerData = data || [];
    setWinnings(winnerData);

    const total = winnerData.reduce(
      (sum, item) => sum + Number(item.prize_amount || 0),
      0
    );

    setTotalWon(total);
    setLoading(false);
  }

  useEffect(() => {
    loadWinnings();
  }, []);

  async function handleUploadProof() {
    if (!selectedWinner) {
      setMessage("Please select a winner record.");
      setIsSuccess(false);
      return;
    }

    if (!selectedFile) {
      setMessage("Please select a screenshot file.");
      setIsSuccess(false);
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("winner_id", selectedWinner);
      formData.append("file", selectedFile);

      const response = await fetch("/api/winner-proof/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Upload failed.");
        setIsSuccess(false);
        return;
      }

      setMessage("Winner proof uploaded successfully. Admin will review your screenshot.");
      setIsSuccess(true);
      setSelectedWinner(null);
      setSelectedFile(null);

      // Refresh winnings
      await loadWinnings();
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong during upload.");
      setIsSuccess(false);
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 font-medium">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <span>Loading winnings overview...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header & Total Won Card */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              WINNINGS OVERVIEW
            </p>
            <Link
              href="/dashboard/draw"
              className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              Current Draw →
            </Link>
          </div>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Your Winnings
          </h1>

          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Real-time track record of your sweepstakes prizes, verification state, and payout status.
          </p>

          <div className="mt-6 rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-6 dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Total Prize Money Won
            </p>

            <p className="mt-2 text-4xl font-black tracking-tight text-emerald-950 dark:text-emerald-300">
              ₹{totalWon.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>

            <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
              Across all monthly draws entered with qualified scores.
            </p>
          </div>

          {/* Feedback message banner */}
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
        </div>

        {/* Winning History List */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Winning History
            </h2>
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
              {winnings.length} record(s)
            </span>
          </div>

          {winnings.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 p-8 text-center dark:border-gray-800 dark:bg-gray-800/30">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-500 dark:bg-slate-800">
                🏆
              </div>
              <p className="mt-3 text-base font-semibold text-gray-800 dark:text-gray-200">
                No winnings yet
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Enter your 5 scores into the monthly draw for a chance to win!
              </p>
              <div className="mt-4">
                <Link
                  href="/dashboard/draw"
                  className="inline-flex items-center rounded-xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
                >
                  Enter Current Draw →
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {winnings.map((winner) => (
                <div
                  key={winner.id}
                  className="rounded-2xl border border-gray-200/90 bg-gray-50/50 p-6 transition hover:border-emerald-300 dark:border-gray-800 dark:bg-gray-800/40"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          {winner.match_type.replace("_", " ")}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(winner.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="mt-2 text-3xl font-black text-gray-900 dark:text-white">
                        ₹{Number(winner.prize_amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
                      <div className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">
                          Verification
                        </p>
                        <p
                          className={`mt-0.5 font-bold capitalize ${
                            winner.verification_status === "approved"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : winner.verification_status === "rejected"
                              ? "text-red-600 dark:text-red-400"
                              : "text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {winner.verification_status}
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">
                          Payout Status
                        </p>
                        <p
                          className={`mt-0.5 font-bold capitalize ${
                            winner.payout_status === "paid"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {winner.payout_status}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Upload Score Proof section when status is pending */}
                  {winner.verification_status === "pending" && (
                    <div className="mt-5 pt-5 border-t border-gray-200/80 dark:border-gray-700/80">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                        Upload Score Proof Screenshot
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Please upload an official screenshot of your golf scores for admin verification and payout approval.
                      </p>

                      <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            setSelectedWinner(winner.id);
                            setSelectedFile(e.target.files?.[0] || null);
                          }}
                          className="block w-full text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-950 dark:file:text-emerald-400 cursor-pointer"
                        />

                        {selectedWinner === winner.id && selectedFile && (
                          <button
                            type="button"
                            onClick={handleUploadProof}
                            disabled={uploading}
                            className="rounded-xl bg-slate-950 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400 cursor-pointer whitespace-nowrap"
                          >
                            {uploading ? "Uploading..." : "Upload Proof"}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
