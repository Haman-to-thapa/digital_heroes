"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Profile = {
  full_name: string | null;
  role: string;
  charity_id: string | null;
  charity_percentage?: number;
};

type Charity = {
  name: string;
};

type Subscription = {
  status: string;
  plan_type: string;
  current_period_end: string | null;
};

interface AdminStats {
  activeSubscribers: number;
  drawMonth: string;
  drawStatus: string;
  winningNumbers: number[];
  prizePool: number;
  totalDonations: number;
  totalWinners: number;
}

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [charity, setCharity] = useState<Charity | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [scoreCount, setScoreCount] = useState(0);
  const [latestScore, setLatestScore] = useState<number | null>(null);
  const [drawCount, setDrawCount] = useState(0);
  const [winningsTotal, setWinningsTotal] = useState(0);
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);

  // Admin specific states
  const [adminStats, setAdminStats] = useState<AdminStats>({
    activeSubscribers: 0,
    drawMonth: "Current Month",
    drawStatus: "draft",
    winningNumbers: [],
    prizePool: 0,
    totalDonations: 0,
    totalWinners: 0,
  });
  const [previewGolferView, setPreviewGolferView] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserEmail(user.email || "");

      // Execute all core user queries in parallel
      const [profileRes, subRes, scoresRes, entriesRes, winningsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, role, charity_id")
          .eq("id", user.id)
          .single(),
        supabase
          .from("subscriptions")
          .select("status, plan_type, current_period_end")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("scores")
          .select("score, score_date")
          .eq("user_id", user.id)
          .order("score_date", { ascending: false })
          .limit(5),
        supabase
          .from("draw_entries")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("winners")
          .select("prize_amount")
          .eq("user_id", user.id),
      ]);

      const profileData = profileRes.data;
      const userRole = profileData?.role || "golfer";

      if (profileData) {
        const savedPercentage = Number(user.user_metadata?.charity_percentage) || 10;
        setProfile({
          ...profileData,
          charity_percentage: savedPercentage,
        });

        // Fetch selected charity details asynchronously if assigned
        if (profileData.charity_id) {
          supabase
            .from("charities")
            .select("name")
            .eq("id", profileData.charity_id)
            .single()
            .then(({ data: charityData }) => {
              if (charityData) setCharity(charityData);
            });
        }
      }

      setSubscription(subRes.data);

      const scoreData = scoresRes.data || [];
      setScoreCount(scoreData.length);
      setLatestScore(scoreData[0]?.score ?? null);

      setDrawCount(entriesRes.count || 0);

      const totalWinnings = (winningsRes.data || []).reduce(
        (sum, item) => sum + Number(item.prize_amount || 0),
        0
      );
      setWinningsTotal(totalWinnings);

      // If Admin, fetch all platform operations metrics in parallel
      if (userRole === "admin") {
        try {
          const now = new Date();
          const currentMonthStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
          const monthName = now.toLocaleString("en-US", { month: "long", year: "numeric" });

          const [subsRes, drawRes, donationsRes, winnersRes] = await Promise.all([
            supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
            supabase.from("draws").select("*").eq("draw_month", currentMonthStr).maybeSingle(),
            supabase.from("donations").select("amount"),
            supabase.from("winners").select("*", { count: "exact", head: true }),
          ]);

          const donationsSum = (donationsRes.data || []).reduce(
            (acc, curr) => acc + Number(curr.amount || 0),
            0
          );

          setAdminStats({
            activeSubscribers: subsRes.count || 0,
            drawMonth: monthName,
            drawStatus: drawRes.data?.status || "draft",
            winningNumbers: drawRes.data?.winning_numbers || [],
            prizePool: Number(drawRes.data?.total_prize_pool || (subsRes.count || 0) * 100),
            totalDonations: donationsSum,
            totalWinners: winnersRes.count || 0,
          });
        } catch (e) {
          console.error("Error loading admin stats:", e);
        }
      }

      setLoading(false);
    }

    loadDashboardData();
  }, [router, supabase]);

  if (loading) {
    return (
      <main className="min-h-[80vh] flex items-center justify-center">
        <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 font-medium">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <span>Loading dashboard...</span>
        </div>
      </main>
    );
  }

  const isAdmin = profile?.role === "admin";
  const isActive = subscription?.status === "active";

  // =========================================================================
  // 👑 ADMIN COMMAND CENTER DASHBOARD (WHEN ROLE === 'ADMIN')
  // =========================================================================
  if (isAdmin && !previewGolferView) {
    return (
      <main className="min-h-full">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Admin Header Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0b101b] sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-500/20 shadow-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Role: Administrator 👑
                  </span>
                  <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                    Full Operations Access
                  </span>
                </div>

                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                  Admin Command Center
                </h1>

                <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Connected: <span className="font-semibold text-slate-800 dark:text-slate-200">{userEmail}</span> • Everything running live from database
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href="/admin/draw"
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500"
                >
                  🎲 Run Monthly Draw
                </Link>
                <Link
                  href="/admin/payments"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  💳 Payments & Revenue
                </Link>
                <Link
                  href="/admin/subscriptions"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  👥 All Subscribers
                </Link>
                <Link
                  href="/admin/winners"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  🏆 Winning History
                </Link>
                <Link
                  href="/admin/charity"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  🎗️ Charity Impact
                </Link>
              </div>
            </div>
          </div>

          {/* 4 Live Metrics Cards (100% Real Supabase Data) */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Metric 1: Subscribers */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Active Subscribers
                </p>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {adminStats.activeSubscribers}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Live paying members
              </p>
              <Link
                href="/admin/subscriptions"
                className="mt-3 inline-block text-xs font-bold text-emerald-600 hover:underline dark:text-emerald-400 border-t border-slate-100 dark:border-slate-800 pt-2 w-full"
              >
                Inspect Subscribers Audit &rarr;
              </Link>
            </div>

            {/* Metric 2: Draw Status */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {adminStats.drawMonth} Draw
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                    adminStats.drawStatus === "published"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                  }`}
                >
                  {adminStats.drawStatus}
                </span>
              </div>
              <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white capitalize">
                {adminStats.drawStatus === "published" ? "Published ✓" : adminStats.winningNumbers.length === 5 ? "Numbers Ready" : "Draft Open"}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {adminStats.winningNumbers.length === 5
                  ? `Numbers: [ ${adminStats.winningNumbers.join(", ")} ]`
                  : "Awaiting number simulation"}
              </p>
              <Link
                href="/admin/draw"
                className="mt-3 inline-block text-xs font-bold text-emerald-600 hover:underline dark:text-emerald-400 border-t border-slate-100 dark:border-slate-800 pt-2 w-full"
              >
                Open Draw Controller &rarr;
              </Link>
            </div>

            {/* Metric 3: Prize Pool */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Current Prize Pool
                </p>
                <span className="text-xs">💰</span>
              </div>
              <h2 className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                ₹{adminStats.prizePool.toLocaleString("en-IN")}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                40% 5-Match • 35% 4-Match • 25% 3-Match
              </p>
              <Link
                href="/admin/draw"
                className="mt-3 inline-block text-xs font-bold text-emerald-600 hover:underline dark:text-emerald-400 border-t border-slate-100 dark:border-slate-800 pt-2 w-full"
              >
                View Prize Splits &rarr;
              </Link>
            </div>

            {/* Metric 4: Charity Funds */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Charity Fund Raised
                </p>
                <span className="text-xs">🎗️</span>
              </div>
              <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                ₹{adminStats.totalDonations.toLocaleString("en-IN")}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Direct community impact
              </p>
              <Link
                href="/admin/charity"
                className="mt-3 inline-block text-xs font-bold text-emerald-600 hover:underline dark:text-emerald-400 border-t border-slate-100 dark:border-slate-800 pt-2 w-full"
              >
                Charity Donations Audit &rarr;
              </Link>
            </div>
          </div>

          {/* 5 Core Admin Operation Hubs */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* HUB 1: DRAW MANAGEMENT */}
            <div className="flex flex-col justify-between rounded-3xl border-2 border-emerald-500/30 bg-white p-6 shadow-sm dark:border-emerald-500/20 dark:bg-[#0b101b]">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  🎲
                </div>
                <h3 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-white">
                  Monthly Sweepstakes Draw
                </h3>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Golfers submit 5 golf scores. Click once to generate 5 winning numbers, lock the draw, and calculate cash prizes for 5, 4, and 3-number matches.
                </p>

                {adminStats.winningNumbers.length === 5 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {adminStats.winningNumbers.map((n, i) => (
                      <span
                        key={i}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6">
                <Link
                  href="/admin/draw"
                  className="flex w-full items-center justify-center rounded-xl bg-emerald-600 py-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-emerald-500"
                >
                  Open Draw Management &rarr;
                </Link>
              </div>
            </div>

            {/* HUB 2: PAYMENTS & REVENUE */}
            <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-[#0b101b]">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  💳
                </div>
                <h3 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-white">
                  Payments & Platform Revenue
                </h3>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Track all incoming subscription payments, Stripe customer accounts, monthly vs annual revenue, and billing transaction histories.
                </p>

                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Total Active Revenue:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">₹{adminStats.activeSubscribers * 499}+</strong>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href="/admin/payments"
                  className="flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white py-3 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                >
                  Audit All Payments &rarr;
                </Link>
              </div>
            </div>

            {/* HUB 3: SUBSCRIBERS AUDIT */}
            <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-[#0b101b]">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-2xl dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  👥
                </div>
                <h3 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-white">
                  Subscribers Management
                </h3>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Check exactly who has subscribed: Monthly vs Annual plans, active status, Stripe customer IDs, and renewal dates in one clean table.
                </p>

                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Total Active:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">{adminStats.activeSubscribers} Members</strong>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href="/admin/subscriptions"
                  className="flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white py-3 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                >
                  View All Subscribers &rarr;
                </Link>
              </div>
            </div>

            {/* HUB 4: WINNING HISTORY & PROOFS */}
            <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-[#0b101b]">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-2xl dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                  🏆
                </div>
                <h3 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-white">
                  Winning History & Proofs
                </h3>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Historical archive of all winners across all draws. Review scorecard screenshot proofs and approve cash payouts.
                </p>

                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Total Winners:</span>
                    <strong className="text-indigo-600 dark:text-indigo-400">{adminStats.totalWinners} Qualified</strong>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href="/admin/winners"
                  className="flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white py-3 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                >
                  Winning History & Proofs &rarr;
                </Link>
              </div>
            </div>

            {/* HUB 5: CHARITY DONATIONS AUDIT */}
            <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-[#0b101b]">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-2xl dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                  🎗️
                </div>
                <h3 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-white">
                  Charity Donations Audit
                </h3>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Audit every donation made by golfers. View partner NGO distributions, contribution percentages, and impact totals.
                </p>

                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Funds Raised:</span>
                    <strong className="text-rose-600 dark:text-rose-400">₹{adminStats.totalDonations.toLocaleString("en-IN")}</strong>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href="/admin/charity"
                  className="flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white py-3 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                >
                  Audit Charity Donations &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // =========================================================================
  // ⛳ REGULAR GOLFER DASHBOARD (OR PREVIEW MODE FOR ADMIN)
  // =========================================================================
  return (
    <main className="min-h-full">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* If Admin is Previewing Golfer View */}
        {isAdmin && previewGolferView && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 dark:border-amber-500/30 dark:bg-amber-950/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">👁️</span>
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                You are previewing the Golfer Member View.
              </span>
            </div>
            <button
              onClick={() => setPreviewGolferView(false)}
              className="rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-500 cursor-pointer"
            >
              Return to Admin Command Center 👑
            </button>
          </div>
        )}

        {/* If Inactive Golfer: Clear Alert Banner with Direct Activate / Sync Options */}
        {!isActive && !isAdmin && (
          <div className="rounded-2xl border border-amber-300/80 bg-linear-to-r from-amber-50 to-orange-50 p-5 shadow-xs dark:border-amber-900/60 dark:from-amber-950/40 dark:to-orange-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-xl text-amber-600 dark:text-amber-400">
                  ⭐
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-amber-950 dark:text-amber-200">
                      Standard Account — Activate VIP Hero Subscription
                    </h3>
                    <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold uppercase text-amber-800 dark:text-amber-300">
                      ₹100 / month
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                    Subscribe now to unlock monthly sweepstakes draws, 5-score match cash jackpots, priority scorecard audit, and tax-deductible charity giving.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Link
                  href="/dashboard/subscription"
                  className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-xs transition hover:bg-amber-500"
                >
                  ⭐ Unlock VIP Pass
                </Link>
                <Link
                  href="/dashboard/subscription"
                  className="inline-flex items-center justify-center rounded-xl border border-amber-300 bg-white px-3 py-2.5 text-xs font-bold text-amber-900 shadow-xs hover:bg-amber-50 dark:border-amber-800 dark:bg-slate-900 dark:text-amber-300"
                >
                  ⚡ Sync Paid Stripe
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Profile Header Card */}
        <div
          className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-sm transition-all ${
            isActive
              ? "border-2 border-emerald-500/40 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/20 dark:border-emerald-500/30 dark:from-[#0b121e] dark:via-[#091724] dark:to-[#081518]"
              : "border border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900"
          }`}
        >
          {/* Subtle VIP background watermark if subscribed */}
          {isActive && (
            <div className="pointer-events-none absolute -right-6 -bottom-10 select-none text-[130px] font-black text-emerald-500/5 dark:text-emerald-400/5">
              VIP
            </div>
          )}

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {/* Upper: Role Badge + VIP Badge */}
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                {isActive ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-amber-500/15 via-emerald-500/20 to-teal-500/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-xs">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      ⭐ VIP HERO MEMBER
                    </span>
                    <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300 border border-amber-500/20">
                      👑 Premium Tier Active
                    </span>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-700 dark:bg-slate-900/60 dark:text-slate-400 border border-slate-300/40 dark:border-slate-800 shadow-xs">
                    Role: {profile?.role || "Golfer"} (Standard)
                  </span>
                )}
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                  • Verified Account
                </span>
              </div>

              {/* Main Heading: User Name / Full Name */}
              <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                {profile?.full_name || (userEmail ? userEmail.split("@")[0] : "Golfer")}
                {isActive && (
                  <span className="ml-2 text-2xl text-amber-500 inline-block" title="VIP Hero">
                    ⭐
                  </span>
                )}
              </h1>

              {/* Subtext: User Account details */}
              <p className="mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                Connected account: <span className="font-semibold text-gray-800 dark:text-gray-200">{userEmail}</span>
                {isActive && (
                  <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-bold">
                    • All 6 VIP facilities unlocked
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/dashboard/scores"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-500"
              >
                Manage Scores ⛳
              </Link>
              <Link
                href="/dashboard/draw"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:text-emerald-200 border border-emerald-500/20"
              >
                Monthly Draw 🎲
              </Link>
              <Link
                href="/dashboard/subscription"
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                {isActive ? "VIP Pass 👑" : "Subscription 💳"}
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid - 5 Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Card 1: Subscription / Role */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {profile?.role === "admin" ? "Access Level" : "Subscription"}
              </p>
              {(isActive || profile?.role === "admin") && (
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>

            <h2
              className={`mt-2 text-xl font-bold capitalize ${
                profile?.role === "admin" || isActive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-gray-900 dark:text-white"
              }`}
            >
              {profile?.role === "admin" ? "Admin VIP Access 👑" : isActive ? `${subscription?.plan_type || "Active"} Member` : (subscription?.status || "Inactive")}
            </h2>

            {profile?.role === "admin" ? (
              <div className="mt-1 space-y-1">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  Full Platform Access
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  All draws & features unlocked
                </p>
              </div>
            ) : subscription?.plan_type ? (
              <div className="mt-1 space-y-1">
                <p className="text-xs font-medium capitalize text-gray-600 dark:text-gray-300">
                  {subscription.plan_type === "yearly" ? "Annual (12 Months)" : "Monthly (30 Days)"}
                </p>
                {subscription.current_period_end && (
                  <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {Math.max(
                      0,
                      Math.ceil(
                        (new Date(subscription.current_period_end).getTime() - Date.now()) /
                          (1000 * 60 * 60 * 24)
                      )
                    )}{" "}
                    days remaining
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                Pick a plan to enter draws
              </p>
            )}

            {profile?.role === "admin" ? (
              <Link
                href="/admin/draw"
                className="mt-2 inline-block text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400 border-t border-gray-100 dark:border-gray-800/80 pt-2 w-full"
              >
                Go to Admin Draw Panel &rarr;
              </Link>
            ) : subscription?.current_period_end ? (
              <p className="mt-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800/80 pt-2">
                End Date:{" "}
                <span className="text-gray-700 dark:text-gray-200 font-semibold">
                  {new Date(subscription.current_period_end).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </p>
            ) : (
              <Link
                href="/dashboard/subscription"
                className="mt-2 inline-block text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
              >
                Choose plan &rarr;
              </Link>
            )}
          </div>

          {/* Card 2: Charity */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              My Charity
            </p>
            <h2
              className="mt-2 text-xl font-bold text-gray-900 dark:text-white truncate"
              title={charity?.name || "Not selected"}
            >
              {charity?.name || "Not selected"}
            </h2>
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
              Cause Supported 🎗️
            </p>
            <Link
              href="/dashboard/charity"
              className="mt-2 inline-block text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
            >
              {charity ? "Change Charity & %" : "Choose Charity & %"} &rarr;
            </Link>
          </div>

          {/* Card 3: Golf Scores */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Golf Scores
            </p>
            <h2 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
              {scoreCount} / 5
            </h2>
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {latestScore !== null
                ? `Latest score: ${latestScore}`
                : "No scores yet"}
            </p>
            <Link
              href="/dashboard/scores"
              className="mt-2 inline-block text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
            >
              Manage scores &rarr;
            </Link>
          </div>

          {/* Card 4: Draws */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Draws Entered
            </p>
            <h2 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
              {drawCount}
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {scoreCount === 5 ? "Eligible for next draw ✅" : "Needs 5 Scores"}
            </p>
            <Link
              href="/dashboard/draw"
              className="mt-2 inline-block text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
            >
              View entry status &rarr;
            </Link>
          </div>

          {/* Card 5: Total Winnings */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Winnings
            </p>
            <h2 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
              ₹{winningsTotal.toFixed(2)}
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {winningsTotal > 0 ? "Verified payouts" : "Participate to win"}
            </p>
            <Link
              href="/dashboard/winnings"
              className="mt-2 inline-block text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
            >
              My winnings &rarr;
            </Link>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 👑 VIP HERO FACILITIES & PRIVILEGES HUB (ALL 6 PERKS)                     */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-amber-500/20 to-emerald-500/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-xs">
                  <span>⭐</span> VIP HERO PRIVILEGES
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {isActive ? "6 / 6 Facilities Active" : "Requires VIP Membership"}
                </span>
              </div>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {isActive ? "Your VIP Member Privileges & Facilities" : "Unlock All 6 VIP Member Facilities"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isActive
                  ? "As an active subscriber, you have full privileges to submit scores, enter sweepstakes draws, win cash jackpots, and give back to society."
                  : "Upgrade to VIP Hero for ₹100/mo to unlock full lottery sweepstakes eligibility, scorecard verification, and direct prize payouts."}
              </p>
            </div>

            <div className="shrink-0">
              <Link
                href="/dashboard/subscription"
                className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-extrabold shadow-xs transition ${
                  isActive
                    ? "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    : "bg-emerald-600 text-white hover:bg-emerald-500"
                }`}
              >
                {isActive ? "Manage VIP Pass 👑" : "Unlock VIP Membership (₹100/mo) ⭐"}
              </Link>
            </div>
          </div>

          {/* 6 Facilities Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* PERK 1: MONTHLY SWEEPSTAKES ENTRY */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-lg">
                    🎟️
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                      isActive
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {isActive ? "Active Entry ✓" : "Locked 🔒"}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-black text-slate-900 dark:text-white">
                  Monthly Sweepstakes Entry
                </h3>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Your subscription automatically funds ₹100 into the prize pool and secures your entry ticket into every monthly draw. No extra ticket purchases needed.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {isActive ? "Enrolled for Current Draw" : "Subscribe to enter"}
                </span>
                <Link href="/dashboard/draw" className="font-bold text-slate-700 hover:underline dark:text-slate-300">
                  View Draw &rarr;
                </Link>
              </div>
            </div>

            {/* PERK 2: 5-SCORE QUALIFYING JACKPOT ENGINE */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-lg">
                    ⛳
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                      scoreCount === 5
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                    }`}
                  >
                    {scoreCount === 5 ? "5/5 Qualified ✓" : `${scoreCount}/5 Scores`}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-black text-slate-900 dark:text-white">
                  5-Score Jackpot Engine
                </h3>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Log 5 official golf scores. Match 3 numbers for 25% pool share, 4 numbers for 35% pool share, or 5 numbers for the 40% Grand Jackpot.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500 dark:text-slate-400">
                  {5 - scoreCount > 0 ? `Needs ${5 - scoreCount} more score(s)` : "Fully qualified"}
                </span>
                <Link href="/dashboard/scores" className="font-bold text-emerald-600 hover:underline dark:text-emerald-400">
                  Log Score &rarr;
                </Link>
              </div>
            </div>

            {/* PERK 3: TAX-DEDUCTIBLE CHARITY MULTIPLIER */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-lg">
                    🎗️
                  </span>
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                    {profile?.charity_percentage || 10}% Pledged
                  </span>
                </div>
                <h3 className="mt-3 text-base font-black text-slate-900 dark:text-white">
                  Charity Impact Multiplier
                </h3>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Select your charity of choice (e.g. Wildlife SOS, Smile Foundation) and choose 10%–100% of your jackpot winnings to directly fund grassroots causes.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="truncate font-semibold text-slate-600 dark:text-slate-400 max-w-[130px]">
                  {charity?.name || "Select Charity"}
                </span>
                <Link href="/dashboard/charity" className="font-bold text-rose-600 hover:underline dark:text-rose-400">
                  Select Cause &rarr;
                </Link>
              </div>
            </div>

            {/* PERK 4: FAST-TRACK SCORE PROOF AUDIT */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-lg">
                    ⚡
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                      isActive
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {isActive ? "24h Priority SLA" : "Standard SLA"}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-black text-slate-900 dark:text-white">
                  Fast-Track Proof Audit
                </h3>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Uploaded scorecards, golf club receipts, and handicap attestations from VIP members receive rapid priority audit verification before monthly draw closure.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Verified by Admin</span>
                <Link href="/dashboard/scores" className="font-bold text-amber-600 hover:underline dark:text-amber-400">
                  Upload Proof &rarr;
                </Link>
              </div>
            </div>

            {/* PERK 5: VIP CROWN & LEADERBOARD RECOGNITION */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-lg">
                    🏆
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                      isActive
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {isActive ? "VIP Hero Tag ⭐" : "Free Tag"}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-black text-slate-900 dark:text-white">
                  VIP Crown & Recognition
                </h3>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  VIP Hero members receive official platform badges across public leaderboards, verified winner showcases, and community draws.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  {isActive ? "Badge displayed" : "Subscribe to unlock"}
                </span>
                <Link href="/draws" className="font-bold text-slate-700 hover:underline dark:text-slate-300">
                  Public Board &rarr;
                </Link>
              </div>
            </div>

            {/* PERK 6: DIRECT CASH CONCIERGE PAYOUTS */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-lg">
                    💰
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                      isActive
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {isActive ? "Ready for Payout" : "Inactive"}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-black text-slate-900 dark:text-white">
                  Direct Cash Concierge Payout
                </h3>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Instant prize disbursement straight to your bank account or UPI VPA upon winner verification, with full transaction receipts and audit trail.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  ₹{winningsTotal.toFixed(2)} Total Won
                </span>
                <Link href="/dashboard/winnings" className="font-bold text-slate-700 hover:underline dark:text-slate-300">
                  View Winnings &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ⛳ 4-STEP ROADMAP TO WIN CASH JACKPOTS                                    */}
        {/* ========================================================================= */}
        <div className="rounded-3xl border border-slate-200/80 bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 text-white shadow-md">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-emerald-300 border border-emerald-500/30">
              ⚡ HOW TO PARTICIPATE & WIN
            </span>
            <h3 className="mt-2 text-2xl font-black">Turn Your Golf Rounds Into Real Cash Jackpots</h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Follow these 4 simple steps to maximize your chances in every monthly sweepstakes draw.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-white/5 p-4 border border-white/10 backdrop-blur-xs">
              <span className="text-xl">1️⃣</span>
              <h4 className="mt-2 text-sm font-bold text-white">Active VIP Pass</h4>
              <p className="mt-1 text-xs text-slate-400">
                {isActive ? "✓ Completed: Your membership is active." : "Subscribe for ₹100/mo to enter draws."}
              </p>
            </div>

            <div className="rounded-2xl bg-white/5 p-4 border border-white/10 backdrop-blur-xs">
              <span className="text-xl">2️⃣</span>
              <h4 className="mt-2 text-sm font-bold text-white">Log 5 Golf Scores</h4>
              <p className="mt-1 text-xs text-slate-400">
                {scoreCount === 5 ? "✓ Completed: 5/5 scores ready." : `Progress: ${scoreCount}/5 scores logged.`}
              </p>
            </div>

            <div className="rounded-2xl bg-white/5 p-4 border border-white/10 backdrop-blur-xs">
              <span className="text-xl">3️⃣</span>
              <h4 className="mt-2 text-sm font-bold text-white">Pick Your Charity</h4>
              <p className="mt-1 text-xs text-slate-400">
                {charity ? `✓ ${charity.name} (${profile?.charity_percentage || 10}%)` : "Select your charity and giving %."}
              </p>
            </div>

            <div className="rounded-2xl bg-white/5 p-4 border border-white/10 backdrop-blur-xs">
              <span className="text-xl">4️⃣</span>
              <h4 className="mt-2 text-sm font-bold text-white">Match & Win Cash</h4>
              <p className="mt-1 text-xs text-slate-400">
                Match 3, 4, or 5 numbers in the monthly draw to claim real payouts!
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
