"use client";

import { useState } from "react";

type Plan = "monthly" | "yearly";

export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState<Plan>("monthly");
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
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

  return (
    <main className="min-h-full p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
            PRD Step 40
          </span>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Choose Your Plan 💳
          </h1>

          <p className="mx-auto mt-2 max-w-2xl text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Join Digital Heroes and participate in monthly sweepstakes draws while supporting a verified charity.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {/* Monthly Plan */}
          <button
            type="button"
            onClick={() => setSelectedPlan("monthly")}
            className={`rounded-2xl border-2 p-6 text-left shadow-sm transition cursor-pointer ${
              selectedPlan === "monthly"
                ? "border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600 dark:border-emerald-500 dark:bg-emerald-950/20"
                : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                MONTHLY PLAN
              </span>
              {selectedPlan === "monthly" && (
                <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white">
                  Selected
                </span>
              )}
            </div>

            <h2 className="mt-3 text-2xl font-extrabold text-gray-900 dark:text-white">
              Monthly Membership
            </h2>

            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Flexible month-to-month subscription. Cancel anytime.
            </p>

            <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/60">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Pricing
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                Configured in Stripe Dashboard
              </p>
            </div>
          </button>

          {/* Yearly Plan */}
          <button
            type="button"
            onClick={() => setSelectedPlan("yearly")}
            className={`rounded-2xl border-2 p-6 text-left shadow-sm transition cursor-pointer ${
              selectedPlan === "yearly"
                ? "border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600 dark:border-emerald-500 dark:bg-emerald-950/20"
                : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                YEARLY PLAN (DISCOUNTED)
              </span>
              {selectedPlan === "yearly" && (
                <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white">
                  Selected
                </span>
              )}
            </div>

            <h2 className="mt-3 text-2xl font-extrabold text-gray-900 dark:text-white">
              Annual Membership
            </h2>

            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Discounted yearly rate with uninterrupted monthly sweepstakes access.
            </p>

            <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/60">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Pricing
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                Configured in Stripe Dashboard
              </p>
            </div>
          </button>
        </div>

        {/* Action Card */}
        <div className="mt-8 rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Selected Tier:{" "}
            <span className="capitalize text-emerald-600 dark:text-emerald-400">
              {selectedPlan} Subscription
            </span>
          </h2>

          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {selectedPlan === "monthly"
              ? "You will be enrolled into the monthly sweepstakes cycle on a recurring monthly basis."
              : "You will receive full 12 months access with discounted rate and automatic entry into all annual draws."}
          </p>

          <button
            type="button"
            disabled={loading}
            onClick={handleSubscribe}
            className="mt-6 flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 cursor-pointer"
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
        </div>
      </div>
    </main>
  );
}
