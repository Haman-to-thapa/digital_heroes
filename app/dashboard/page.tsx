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

      // 1. Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, role, charity_id")
        .eq("id", user.id)
        .single();

      const userRole = profileData?.role || "golfer";

      if (profileData) {
        const savedPercentage = Number(user.user_metadata?.charity_percentage) || 10;
        setProfile({
          ...profileData,
          charity_percentage: savedPercentage,
        });

        // Fetch selected charity details
        if (profileData.charity_id) {
          const { data: charityData } = await supabase
            .from("charities")
            .select("name")
            .eq("id", profileData.charity_id)
            .single();

          if (charityData) {
            setCharity(charityData);
          }
        }
      }

      // 2. Fetch golfer subscription status
      const { data: subscriptionData } = await supabase
        .from("subscriptions")
        .select("status, plan_type, current_period_end")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setSubscription(subscriptionData);

      // 3. Fetch user's latest scores
      const { data: scoreData } = await supabase
        .from("scores")
        .select("score, score_date")
        .eq("user_id", user.id)
        .order("score_date", { ascending: false })
        .limit(5);

      setScoreCount(scoreData?.length || 0);
      setLatestScore(scoreData?.[0]?.score ?? null);

      // 4. If Admin, fetch live platform operations data
      if (userRole === "admin") {
        try {
          const now = new Date();
          const currentMonthStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;

          // Active subscribers
          const { count: subsCount } = await supabase
            .from("subscriptions")
            .select("*", { count: "exact", head: true })
            .eq("status", "active");

          // Current draw
          const { data: currentDraw } = await supabase
            .from("draws")
            .select("*")
            .eq("draw_month", currentMonthStr)
            .maybeSingle();

          // Total donations from donations table
          const { data: donationsData } = await supabase
            .from("donations")
            .select("amount");

          const donationsSum = (donationsData || []).reduce(
            (acc, curr) => acc + Number(curr.amount || 0),
            0
          );

          // Total winners
          const { count: winnersCount } = await supabase
            .from("winners")
            .select("*", { count: "exact", head: true });

          const monthName = now.toLocaleString("en-US", { month: "long", year: "numeric" });

          setAdminStats({
            activeSubscribers: subsCount || 0,
            drawMonth: monthName,
            drawStatus: currentDraw?.status || "draft",
            winningNumbers: currentDraw?.winning_numbers || [],
            prizePool: Number(currentDraw?.total_prize_pool || (subsCount || 0) * 100),
            totalDonations: donationsSum,
            totalWinners: winnersCount || 0,
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

        {/* Profile Header Card */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {/* Upper: Role Badge */}
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Role: {profile?.role || "Golfer"}
                </span>
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                  • Verified Member
                </span>
              </div>

              {/* Main Heading: User Name / Full Name */}
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                {profile?.full_name || (userEmail ? userEmail.split("@")[0] : "Golfer")}
              </h1>

              {/* Subtext: User Account details */}
              <p className="mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                Connected account: <span className="font-semibold text-gray-800 dark:text-gray-200">{userEmail}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/scores"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
              >
                Manage Scores ⛳
              </Link>
              <Link
                href="/dashboard/charity"
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                My Charity 🎗️
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
              Draws
            </p>
            <h2 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
              {scoreCount === 5 ? "Eligible" : "Needs 5 Scores"}
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Monthly sweepstakes
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
              ₹0
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Verified payouts
            </p>
            <Link
              href="/dashboard/winnings"
              className="mt-2 inline-block text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
            >
              My winnings &rarr;
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
