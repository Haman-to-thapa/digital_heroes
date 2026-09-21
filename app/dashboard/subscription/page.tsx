"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Plan = "monthly" | "yearly";

interface SubscriptionRecord {
  id: string;
  plan_type: "monthly" | "yearly";
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  stripe_subscription_id?: string | null;
}

export default function SubscriptionPage() {
  const supabase = createClient();

  const [selectedPlan, setSelectedPlan] = useState<Plan>("monthly");
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [userRole, setUserRole] = useState<string>("user");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  async function loadSubscription() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserEmail(user.email || "");

        const [profRes, subRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("full_name, role")
            .eq("id", user.id)
            .single(),
          supabase
            .from("subscriptions")
            .select("id, plan_type, status, current_period_start, current_period_end, stripe_subscription_id")
            .eq("user_id", user.id)
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        const prof = profRes.data;
        if (prof) {
          setUserRole(prof.role || "user");
          setUserName(prof.full_name || user.email?.split("@")[0] || "Golfer");
        }

        const data = subRes.data;
        if (!subRes.error && data) {
          setSubscription(data);
          if (data.plan_type === "monthly" || data.plan_type === "yearly") {
            setSelectedPlan(data.plan_type);
          }
        } else {
          setSubscription(null);
        }
      }
    } catch (err) {
      console.error("Error loading subscription:", err);
    } finally {
      setInitialLoading(false);
    }
  }

  useEffect(() => {
    // 1. Check if user just returned from Stripe checkout with ?success=true
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("success") === "true") {
        const sessionId = params.get("session_id");
        setSuccessBanner("🎉 Payment Successful! Welcome to Digital Heroes VIP Membership! All benefits unlocked.");
        
        // Auto-verify with backend to ensure DB is updated immediately
        fetch(`/api/stripe/verify-session${sessionId ? `?session_id=${sessionId}` : ""}`)
          .then((r) => r.json())
          .then((res) => {
            if (res.verified) {
              loadSubscription();
            }
          })
          .catch((err) => console.warn("Auto verification error:", err));
      }
    }

    loadSubscription();
  }, []);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/stripe/verify-session");
      const data = await res.json();
      if (data.verified) {
        setSuccessBanner(data.message || "Subscription synchronized with Stripe! ⭐");
        await loadSubscription();
      } else {
        alert(data.message || "No active Stripe subscription found for this account.");
      }
    } catch {
      alert("Failed to sync with Stripe. Please try again.");
    } finally {
      setSyncing(false);
    }
  }

  async function handleInstantActivation(plan: "monthly" | "yearly") {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/verify-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessBanner(data.message);
        await loadSubscription();
      } else {
        alert(data.error || "Failed to activate subscription.");
      }
    } catch {
      alert("Error activating subscription.");
    } finally {
      setLoading(false);
    }
  }

  const isAdmin = userRole === "admin";
  const isSubscribed = subscription?.status === "active";

  const endDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end)
    : null;

  const startDate = subscription?.current_period_start
    ? new Date(subscription.current_period_start)
    : null;

  const daysRemaining = endDate
    ? Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const formattedEndDate = endDate
    ? endDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const formattedStartDate = startDate
    ? startDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  async function handleSubscribe() {
    if (isSubscribed) {
      alert("You already have an active subscription!");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: selectedPlan,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Payment URL was not received.");
        setLoading(false);
      }
    } catch (err: any) {
      alert(err.message || "Failed to initiate payment");
      setLoading(false);
    }
  }

  async function cancelSubscription() {
    const confirmed = window.confirm(
      "Are you sure you want to cancel your subscription at the end of the current billing cycle?"
    );
    if (!confirmed) return;

    setCancelling(true);
    setCancelMessage(null);
    try {
      const response = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Unable to cancel subscription.");
        return;
      }

      setCancelMessage(data.message || "Subscription cancellation scheduled.");
      alert(data.message || "Subscription cancellation scheduled.");
    } catch {
      alert("Something went wrong cancelling subscription.");
    } finally {
      setCancelling(false);
    }
  }

  if (initialLoading) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="flex items-center space-x-3 text-slate-500 dark:text-slate-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <span className="text-sm font-medium">Checking subscription status...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        
        {/* SUCCESS NOTIFICATION BANNER */}
        {successBanner && (
          <div className="rounded-3xl border-2 border-emerald-500 bg-emerald-500/15 p-5 dark:bg-emerald-950/40 shadow-lg animate-in fade-in slide-in-from-top-3 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white text-xl shadow-sm">
                  👑
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-emerald-950 dark:text-emerald-200">
                    VIP Membership Confirmed!
                  </h3>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                    {successBanner}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSuccessBanner(null)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 dark:text-emerald-300"
              >
                ✕ Close
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/50">
            {isSubscribed ? "⭐ VIP HERO MEMBER" : "PRD STEP 40 • SWEEPSTAKES ACCESS"}
          </div>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            {isSubscribed ? "Your VIP Member Portal 🌟" : "Upgrade to VIP Hero Membership 💳"}
          </h1>

          <p className="mx-auto mt-2 max-w-2xl text-sm sm:text-base text-slate-600 dark:text-slate-400">
            {isSubscribed
              ? "Your account is actively enrolled in all monthly sweepstakes draws with direct charity impact and exclusive golfer benefits."
              : "Select a membership tier to unlock official monthly sweepstakes entries, score handicap tracking, and automated charity contributions."}
          </p>
        </div>

        {/* ADMINISTRATOR VIP BADGE BANNER */}
        {isAdmin && (
          <div className="overflow-hidden rounded-3xl border-2 border-amber-500/80 bg-gradient-to-r from-amber-500/10 via-slate-50 to-emerald-500/10 p-6 sm:p-8 shadow-sm dark:border-amber-500/50 dark:from-amber-950/40 dark:via-[#0c1322] dark:to-emerald-950/30">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl dark:bg-amber-950/80 shadow-xs">
                  👑
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Privileged Role
                    </span>
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                      Platform Administrator
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    Administrator Full Access (No Billing Required)
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/admin"
                  className="inline-flex items-center space-x-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-amber-500"
                >
                  <span>Admin Command Center</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            <p className="mt-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-amber-200/60 dark:border-amber-900/50 pt-3">
              As a platform administrator, you have unrestricted access to submit draw scores, test draw simulations, review proofs, and audit charity contributions.
            </p>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIP SUBSCRIBED HERO CARD (GOLD & EMERALD PREVIEW)              */}
        {/* ============================================================== */}
        {isSubscribed ? (
          <div className="space-y-8">
            {/* VIP PASS CARD */}
            <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/80 bg-gradient-to-br from-[#064e3b] via-[#042f2e] to-[#022c22] p-8 text-white shadow-2xl">
              {/* Background ambient accents */}
              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
              <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-emerald-400/20">
                <div className="flex items-center space-x-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400 text-3xl text-slate-950 font-black shadow-lg ring-4 ring-amber-400/30">
                    👑
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-amber-400/20 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300 border border-amber-400/40">
                        OFFICIAL VIP MEMBER PASS
                      </span>
                      <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <h2 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-white">
                      {userName}
                    </h2>
                    <p className="text-xs text-emerald-200 font-mono mt-0.5">
                      {userEmail} • Verified Member
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="rounded-2xl bg-emerald-950/70 border border-emerald-400/30 px-4 py-2.5 backdrop-blur-md">
                    <p className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold">Active Tier</p>
                    <p className="text-sm font-black capitalize text-white">
                      {subscription?.plan_type === "yearly" ? "🌟 Annual VIP (₹4,999/yr)" : "⭐ Monthly VIP (₹499/mo)"}
                    </p>
                  </div>
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2.5 text-xs font-bold text-white transition backdrop-blur-md cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{syncing ? "Syncing…" : "⚡ Refresh Status"}</span>
                  </button>
                </div>
              </div>

              {/* 4 Status Pills */}
              <div className="relative z-10 mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur-sm">
                  <p className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold">Draw Eligibility</p>
                  <p className="mt-1 text-lg font-black text-white">100% Eligible 🎟️</p>
                  <p className="text-xs text-emerald-200/80 mt-0.5">Auto-entered in Monthly Draw</p>
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur-sm">
                  <p className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold">Billing Cycle</p>
                  <p className="mt-1 text-lg font-black text-white capitalize">
                    {subscription?.plan_type === "yearly" ? "Annual Plan" : "30-Day Monthly"}
                  </p>
                  <p className="text-xs text-emerald-200/80 mt-0.5">Automatic recurring cycle</p>
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur-sm">
                  <p className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold">Days Remaining</p>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-amber-300">
                      {daysRemaining !== null ? daysRemaining : "30"}
                    </span>
                    <span className="text-xs text-emerald-200">Days Active</span>
                  </div>
                  <p className="text-xs text-emerald-200/80 mt-0.5">Until next renewal</p>
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur-sm">
                  <p className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold">Renewal Date</p>
                  <p className="mt-1 text-base font-bold text-white">
                    {formattedEndDate || "Continuous"}
                  </p>
                  <p className="text-xs text-emerald-200/80 mt-0.5">Active coverage period</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative z-10 mt-6">
                <div className="flex justify-between text-xs text-emerald-200 mb-1.5">
                  <span>Membership Cycle Progress</span>
                  <span>{daysRemaining !== null ? `${daysRemaining} days left` : "Active"}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-emerald-950/80 overflow-hidden border border-emerald-500/20">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-amber-300 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(10, ((30 - (daysRemaining || 0)) / 30) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* UNLOCKED PREMIUM PRIVILEGES & FACILITIES (PRD HIGHLIGHTS) */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-[#0b101b] sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    VIP PRIVILEGES & PERKS
                  </span>
                  <h3 className="text-2xl font-black text-slate-950 dark:text-white mt-0.5">
                    Your Unlocked Premium Facilities 🌟
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    All premium features have been enabled on your account based on PRD requirements.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 px-3 py-1 text-xs font-bold">
                    ✓ 6 of 6 Active
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Perk 1 */}
                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">🎟️</span>
                    <span className="rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold px-2 py-0.5">
                      ACTIVE
                    </span>
                  </div>
                  <h4 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                    Monthly Sweepstakes Entry
                  </h4>
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Automatically enrolled into every monthly lottery draw. ₹100 from your membership directly fuels the community prize pool.
                  </p>
                  <Link
                    href="/dashboard/draw"
                    className="mt-3 inline-block text-xs font-bold text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    View Draw Page &rarr;
                  </Link>
                </div>

                {/* Perk 2 */}
                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">⛳</span>
                    <span className="rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold px-2 py-0.5">
                      ACTIVE
                    </span>
                  </div>
                  <h4 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                    5-Score Qualifying Lottery
                  </h4>
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Submit up to 5 Stableford scores per month. Each score generates your lottery numbers to win 3-match, 4-match, or 5-match jackpot!
                  </p>
                  <Link
                    href="/dashboard/scores"
                    className="mt-3 inline-block text-xs font-bold text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    Submit Golf Scores &rarr;
                  </Link>
                </div>

                {/* Perk 3 */}
                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">🎗️</span>
                    <span className="rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold px-2 py-0.5">
                      ACTIVE
                    </span>
                  </div>
                  <h4 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                    Charity Impact Multiplier
                  </h4>
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Direct a customizable 10%–100% portion of any prize winnings to your selected verified charity partner with tax-deductible transparency.
                  </p>
                  <Link
                    href="/dashboard/charity"
                    className="mt-3 inline-block text-xs font-bold text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    Choose Charity Cause &rarr;
                  </Link>
                </div>

                {/* Perk 4 */}
                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">⚡</span>
                    <span className="rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold px-2 py-0.5">
                      ACTIVE
                    </span>
                  </div>
                  <h4 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                    Fast-Track Proof Verification
                  </h4>
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Uploaded scorecard screenshots for winning hits bypass standard delays and are reviewed with top-tier priority by the admin team.
                  </p>
                  <span className="mt-3 inline-block text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    24–48h SLA Guarantee
                  </span>
                </div>

                {/* Perk 5 */}
                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">🏆</span>
                    <span className="rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold px-2 py-0.5">
                      ACTIVE
                    </span>
                  </div>
                  <h4 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                    VIP Crown & Leaderboard
                  </h4>
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Golden VIP status badge is displayed on your golfer profile, public member leaderboard, and sweepstakes winner announcements.
                  </p>
                  <span className="mt-3 inline-block text-xs font-bold text-amber-600 dark:text-amber-400">
                    ⭐ VIP Hero Status
                  </span>
                </div>

                {/* Perk 6 */}
                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">💰</span>
                    <span className="rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold px-2 py-0.5">
                      ACTIVE
                    </span>
                  </div>
                  <h4 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                    Direct Cash Payout Concierge
                  </h4>
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Jackpot and tier prize payouts are disbursed directly via bank transfer or UPI with full compliance documentation.
                  </p>
                  <Link
                    href="/dashboard/winnings"
                    className="mt-3 inline-block text-xs font-bold text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    View My Winnings &rarr;
                  </Link>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Stripe Subscription ID: <code className="font-mono text-emerald-600 dark:text-emerald-400">{subscription?.stripe_subscription_id || "Active"}</code>
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={cancelSubscription}
                    disabled={cancelling}
                    className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:border-rose-300 dark:border-rose-900 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-950/40 disabled:opacity-50 cursor-pointer transition"
                  >
                    {cancelling ? "Scheduling Cancellation…" : "Cancel at Period End"}
                  </button>
                </div>
              </div>
              {cancelMessage && (
                <p className="mt-3 text-xs font-bold text-amber-600 dark:text-amber-400">
                  {cancelMessage}
                </p>
              )}
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* PLAN SELECTION CARDS (FOR UNSUBSCRIBED USERS)                  */
          /* ============================================================== */
          <div className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Monthly Plan */}
              <div
                onClick={() => setSelectedPlan("monthly")}
                className={`relative rounded-3xl border-2 p-8 text-left shadow-sm transition cursor-pointer ${
                  selectedPlan === "monthly"
                    ? "border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-600/30 dark:border-emerald-500 dark:bg-emerald-950/20"
                    : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-[#0b101b]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    MONTHLY PLAN
                  </span>
                  {selectedPlan === "monthly" && (
                    <span className="rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-bold text-white shadow-xs">
                      Selected
                    </span>
                  )}
                </div>

                <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
                  Monthly Membership
                </h2>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-950 dark:text-white">₹499</span>
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">/ month</span>
                </div>

                <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Month-to-month flexibility. 1 automatic sweepstakes entry per month, Stableford handicap tracker, and continuous charity allocation.
                </p>

                <div className="mt-6 space-y-2.5 border-t border-slate-100 dark:border-slate-800 pt-5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>1x Monthly Draw Entry Ticket</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>₹100 Prize Pool Funding Contribution</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>Log up to 5 Stableford Golf Scores</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>10% to 100% Winnings Charity Choice</span>
                  </div>
                </div>
              </div>

              {/* Yearly Plan */}
              <div
                onClick={() => setSelectedPlan("yearly")}
                className={`relative rounded-3xl border-2 p-8 text-left shadow-sm transition cursor-pointer ${
                  selectedPlan === "yearly"
                    ? "border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-600/30 dark:border-emerald-500 dark:bg-emerald-950/20"
                    : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-[#0b101b]"
                }`}
              >
                <div className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                  SAVE 17% • 2 MONTHS FREE
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    ANNUAL VIP PASS
                  </span>
                  {selectedPlan === "yearly" && (
                    <span className="rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-bold text-white shadow-xs">
                      Selected
                    </span>
                  )}
                </div>

                <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
                  Annual Membership
                </h2>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-950 dark:text-white">₹4,999</span>
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">/ year</span>
                </div>

                <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Best value for dedicated golfers. 12 consecutive monthly sweepstakes entries, priority proof verification, and permanent VIP profile crown.
                </p>

                <div className="mt-6 space-y-2.5 border-t border-slate-100 dark:border-slate-800 pt-5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>12x Monthly Sweepstakes Draws (Full Year)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>Priority Fast-Track Proof Verification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>⭐ Exclusive VIP Crown Badge</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>2 Months Completely Free</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Checkout Button */}
            <div className="flex flex-col items-center justify-center space-y-3">
              <button
                type="button"
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full max-w-md rounded-2xl bg-emerald-600 py-4 text-base font-black text-white shadow-md transition hover:bg-emerald-500 hover:shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Connecting to Stripe…" : `Subscribe to ${selectedPlan === "yearly" ? "Annual Pass (₹4,999/yr)" : "Monthly Plan (₹499/mo)"} →`}
              </button>

              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <button
                  type="button"
                  onClick={handleSync}
                  disabled={syncing}
                  className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  {syncing ? "Checking Stripe…" : "⚡ Already paid? Sync with Stripe"}
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => handleInstantActivation(selectedPlan)}
                  disabled={loading}
                  className="font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  ⚡ Instant Test Activation (Sandbox Mode)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
