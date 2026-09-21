"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Plan = "monthly" | "yearly";

interface SubscriptionRecord {
  id: string;
  plan_type: "monthly" | "yearly";
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
}

export default function SubscriptionPage() {
  const supabase = createClient();

  const [selectedPlan, setSelectedPlan] = useState<Plan>("monthly");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [userRole, setUserRole] = useState<string>("user");

  useEffect(() => {
    async function loadSubscription() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Check role from profiles
          const { data: prof } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

          if (prof?.role) {
            setUserRole(prof.role);
          }

          const { data, error } = await supabase
            .from("subscriptions")
            .select("id, plan_type, status, current_period_start, current_period_end")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!error && data) {
            setSubscription(data);
            if (data.plan_type === "monthly" || data.plan_type === "yearly") {
              setSelectedPlan(data.plan_type);
            }
          }
        }
      } catch (err) {
        console.error("Error loading subscription:", err);
      } finally {
        setInitialLoading(false);
      }
    }

    loadSubscription();
  }, [supabase]);

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
    } catch (error) {
      console.error(error);
      alert("Unable to start payment session.");
      setLoading(false);
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
        {/* Header */}
        <div className="text-center">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
            {isSubscribed ? "Active Membership" : "PRD Step 40 • Sweepstakes Access"}
          </span>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            {isSubscribed ? "Your Subscription Status 💳" : "Choose Your Plan 💳"}
          </h1>

          <p className="mx-auto mt-2 max-w-2xl text-sm sm:text-base text-slate-600 dark:text-slate-400">
            {isSubscribed
              ? "You are an active Digital Heroes member with monthly sweepstakes eligibility and continuous charity support."
              : "Join Digital Heroes and participate in monthly sweepstakes draws while supporting a verified charity."}
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
                    Administrator Full Access (No Subscription Required)
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="/admin/draw"
                  className="inline-flex items-center space-x-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-amber-500"
                >
                  <span>Admin Draw Panel</span>
                  <span>→</span>
                </a>
              </div>
            </div>

            <p className="mt-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-amber-200/60 dark:border-amber-900/50 pt-3">
              As a platform administrator, you have unrestricted access to submit draw scores, test draw simulations, review proofs, and audit charity contributions. Billing and subscription restrictions are bypassed for your account.
            </p>
          </div>
        )}

        {/* ACTIVE SUBSCRIPTION DETAILS CARD (Shows Day, Month, & End Date) */}
        {isSubscribed && (
          <div className="overflow-hidden rounded-3xl border-2 border-emerald-500/80 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/60 p-6 shadow-md dark:border-emerald-500/50 dark:from-emerald-950/40 dark:via-[#0c1322] dark:to-teal-950/20 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-200/80 pb-6 dark:border-emerald-900/60">
              <div className="flex items-center space-x-3">
                <span className="relative flex h-3.5 w-3.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500" />
                </span>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Membership Status
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    Active Subscription ({subscription?.plan_type === "yearly" ? "Annual Plan" : "Monthly Plan"})
                  </h2>
                </div>
              </div>

              <div className="inline-flex items-center space-x-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span>Subscribed & Verified</span>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Billing Cycle / Frequency */}
              <div className="rounded-2xl border border-emerald-200/70 bg-white/90 p-4 shadow-xs dark:border-emerald-900/50 dark:bg-slate-900/80">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Billing Cycle
                </p>
                <p className="mt-1 text-lg font-extrabold capitalize text-slate-900 dark:text-white">
                  {subscription?.plan_type === "yearly" ? "12 Months (Yearly)" : "1 Month (Recurring)"}
                </p>
                <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  {subscription?.plan_type === "yearly" ? "365-day full cycle" : "30-day active cycle"}
                </p>
              </div>

              {/* Days Remaining */}
              <div className="rounded-2xl border border-emerald-200/70 bg-white/90 p-4 shadow-xs dark:border-emerald-900/50 dark:bg-slate-900/80">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Days Remaining
                </p>
                <div className="mt-1 flex items-baseline space-x-1.5">
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {daysRemaining !== null ? daysRemaining : "—"}
                  </span>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Days Left</span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  In current billing month
                </p>
              </div>

              {/* Start Date */}
              <div className="rounded-2xl border border-emerald-200/70 bg-white/90 p-4 shadow-xs dark:border-emerald-900/50 dark:bg-slate-900/80">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Started On
                </p>
                <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                  {formattedStartDate || "Active"}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Initial enrollment date
                </p>
              </div>

              {/* End / Renewal Date */}
              <div className="rounded-2xl border border-emerald-300 bg-emerald-500/10 p-4 shadow-xs dark:border-emerald-700/60 dark:bg-emerald-950/40">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    End / Renewal Date
                  </p>
                  <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="mt-1 text-base font-extrabold text-emerald-950 dark:text-emerald-200">
                  {formattedEndDate || "Continuous"}
                </p>
                <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                  Valid until this date
                </p>
              </div>
            </div>

            {/* Sweepstakes Status Notice */}
            <div className="mt-6 flex items-center space-x-3 rounded-2xl bg-white/80 p-4 text-xs font-medium text-slate-700 dark:bg-slate-900/80 dark:text-slate-200 border border-emerald-200/50 dark:border-emerald-900/40">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p>
                <strong className="text-slate-950 dark:text-white">Sweepstakes Ready:</strong> You are fully qualified to submit your 5 Stableford scores for the monthly jackpot draw. Your charity of choice also receives proceeds from this cycle.
              </p>
            </div>
          </div>
        )}

        {/* Plan Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Monthly Plan */}
          <button
            type="button"
            disabled={isSubscribed}
            onClick={() => !isSubscribed && setSelectedPlan("monthly")}
            className={`relative rounded-2xl border-2 p-6 text-left shadow-sm transition ${
              isSubscribed && subscription?.plan_type === "monthly"
                ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/40 dark:border-emerald-500 dark:bg-emerald-950/30"
                : selectedPlan === "monthly" && !isSubscribed
                ? "border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600 dark:border-emerald-500 dark:bg-emerald-950/20"
                : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
            } ${isSubscribed ? "cursor-default opacity-90" : "cursor-pointer"}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                MONTHLY PLAN
              </span>
              {isSubscribed && subscription?.plan_type === "monthly" ? (
                <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-xs">
                  ✓ Current Plan
                </span>
              ) : selectedPlan === "monthly" && (
                <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white">
                  Selected
                </span>
              )}
            </div>

            <h2 className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
              Monthly Membership
            </h2>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Flexible month-to-month subscription. Renews every 30 days automatically.
            </p>

            <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Duration & Cycle
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                Monthly • Day-by-Day Entry Tracking
              </p>
            </div>
          </button>

          {/* Yearly Plan */}
          <button
            type="button"
            disabled={isSubscribed}
            onClick={() => !isSubscribed && setSelectedPlan("yearly")}
            className={`relative rounded-2xl border-2 p-6 text-left shadow-sm transition ${
              isSubscribed && subscription?.plan_type === "yearly"
                ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/40 dark:border-emerald-500 dark:bg-emerald-950/30"
                : selectedPlan === "yearly" && !isSubscribed
                ? "border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600 dark:border-emerald-500 dark:bg-emerald-950/20"
                : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
            } ${isSubscribed ? "cursor-default opacity-90" : "cursor-pointer"}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                YEARLY PLAN (DISCOUNTED)
              </span>
              {isSubscribed && subscription?.plan_type === "yearly" ? (
                <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-xs">
                  ✓ Current Plan
                </span>
              ) : selectedPlan === "yearly" && (
                <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white">
                  Selected
                </span>
              )}
            </div>

            <h2 className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
              Annual Membership
            </h2>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Discounted yearly rate with uninterrupted 12-month access to all sweepstakes draws.
            </p>

            <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Duration & Cycle
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                12 Months • Full Year Coverage (365 Days)
              </p>
            </div>
          </button>
        </div>

        {/* Action Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {isAdmin ? (
              <span className="flex items-center gap-2">
                <span>👑</span> Administrator Bypass Active
              </span>
            ) : isSubscribed ? (
              <span>Subscription Active</span>
            ) : (
              <span>
                Selected Tier:{" "}
                <span className="capitalize text-emerald-600 dark:text-emerald-400">
                  {selectedPlan} Subscription
                </span>
              </span>
            )}
          </h2>

          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {isAdmin ? (
              <span>
                You have administrative access to all Digital Heroes features without payment. You can enter monthly draws, test score logs, or configure charity distributions.
              </span>
            ) : isSubscribed ? (
              <span>
                Your subscription is currently active until <strong className="text-slate-900 dark:text-white">{formattedEndDate}</strong> ({daysRemaining} days remaining). You do not need to make another payment at this time.
              </span>
            ) : selectedPlan === "monthly" ? (
              "You will be enrolled into the monthly sweepstakes cycle on a recurring monthly basis."
            ) : (
              "You will receive full 12 months access with discounted rate and automatic entry into all annual draws."
            )}
          </p>

          {/* Subscribe Button - Disabled / Admin bypass */}
          <div className="mt-6">
            {isAdmin ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-2 rounded-xl bg-amber-100 px-5 py-3 text-sm font-bold text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                  <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Admin Access Unlocked (No Checkout Needed)</span>
                </div>
                <a
                  href="/admin/subscriptions"
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                >
                  Audit All Subscribers &rarr;
                </a>
                <a
                  href="/admin/payments"
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 shadow-xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-850 dark:text-white"
                >
                  View Payments & Revenue &rarr;
                </a>
              </div>
            ) : isSubscribed ? (
              <div className="space-y-3">
                <button
                  type="button"
                  disabled={true}
                  className="flex items-center justify-center space-x-2 rounded-xl bg-slate-200 px-6 py-3 font-semibold text-slate-500 shadow-none cursor-not-allowed dark:bg-slate-800 dark:text-slate-400"
                >
                  <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Already Subscribed ({subscription?.plan_type?.toUpperCase()} ACTIVE)</span>
                </button>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Next renewal / period conclusion: <strong className="font-semibold text-slate-700 dark:text-slate-300">{formattedEndDate}</strong>
                </p>
              </div>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleSubscribe}
                className="flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Redirecting to Stripe...</span>
                  </div>
                ) : (
                  <span>Continue to Payment &rarr;</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
