"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Charity = {
  id: string;
  name: string;
  description: string | null;
  supporters_count?: number;
  total_raised?: number;
};

export default function CharityPage() {
  const supabase = createClient();
  const router = useRouter();

  const [charities, setCharities] = useState<Charity[]>([]);
  const [selectedCharity, setSelectedCharity] = useState("");
  const [percentage, setPercentage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [donationAmount, setDonationAmount] = useState("500");
  const [donating, setDonating] = useState(false);
  const [message, setMessage] = useState("");
  const [userRole, setUserRole] = useState("user");

  // Impact metrics
  const [totalPlatformDonated, setTotalPlatformDonated] = useState(0);
  const [userTotalDonated, setUserTotalDonated] = useState(0);
  const [activeSupportersCount, setActiveSupportersCount] = useState(0);

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // 1. Fetch user's profile charity_id and role
      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("charity_id, role")
        .eq("id", user.id)
        .single();

      if (profileErr) {
        console.error("Error loading profile charity:", profileErr);
      }

      if (profileData?.role) {
        setUserRole(profileData.role);
      }

      setSelectedCharity(profileData?.charity_id || "");

      // 2. Load saved contribution percentage from user metadata (default 10%)
      const savedPercentage = Number(user.user_metadata?.charity_percentage) || 10;
      setPercentage(savedPercentage);

      // 3. Fetch 100% real database metrics from /api/charity/impact (donations, profiles, charities)
      try {
        const res = await fetch("/api/charity/impact");
        if (res.ok) {
          const impactData = await res.json();
          setTotalPlatformDonated(impactData.totalPlatformDonated || 0);
          setUserTotalDonated(impactData.userTotalDonated || 0);
          setActiveSupportersCount(impactData.activeSupportersCount || 0);
          setCharities(impactData.charities || []);
        }
      } catch (err) {
        console.error("Error loading database charity impact:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router, supabase]);

  async function handleSave() {
    if (!selectedCharity) {
      setMessage("Please select a charity from the list.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/charity/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          charity_id: selectedCharity,
          percentage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save charity selection.");
      }

      setMessage(data.message || "Charity and contribution percentage saved successfully! 🎉");

      // Refetch live database numbers
      const res = await fetch("/api/charity/impact");
      if (res.ok) {
        const impactData = await res.json();
        setTotalPlatformDonated(impactData.totalPlatformDonated || 0);
        setUserTotalDonated(impactData.userTotalDonated || 0);
        setActiveSupportersCount(impactData.activeSupportersCount || 0);
        setCharities(impactData.charities || []);
      }
    } catch (err: any) {
      console.error("Error saving charity:", err);
      setMessage(err.message || "Failed to save charity selection.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-[80vh] flex items-center justify-center">
        <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 font-medium">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <span>Loading charity data & community impact...</span>
        </div>
      </main>
    );
  }

  const selectedCharityObj = charities.find((c) => c.id === selectedCharity);

  return (
    <main className="min-h-full p-4 sm:p-6 lg:p-8 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-6 dark:border-slate-800/80">
          <div>
            <div className="flex items-center space-x-2">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                PRD Step 34 • Giving Back
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Community Impact
              </span>
            </div>

            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              Charity & Impact Overview 🎗️
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Track how much charity has been raised by all users and configure your personal contribution percentage.
            </p>
          </div>
        </div>

        {/* Administrator Dedicated Banner */}
        {userRole === "admin" && (
          <div className="overflow-hidden rounded-2xl border-2 border-amber-500/80 bg-amber-500/10 p-5 dark:border-amber-500/50 dark:bg-amber-950/40">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-black uppercase text-slate-950">
                  👑 Admin View
                </span>
                <h3 className="mt-1 text-base font-bold text-slate-950 dark:text-white">
                  Looking for Platform Charity Donations Audit?
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  As an Administrator, you can audit all donor transactions, amounts collected per charity, and member contributions in one central place.
                </p>
              </div>
              <Link
                href="/admin/charity"
                className="rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-amber-500 shrink-0 shadow-sm"
              >
                Open Charity Donations Audit 🎗️ &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* COMMUNITY & PERSONAL CHARITY IMPACT CARDS                      */}
        {/* ============================================================== */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Total Donated by All Users */}
          <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 p-5 shadow-xs dark:border-emerald-500/30 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                Total Raised (All Users)
              </span>
              <span className="text-base">🌍</span>
            </div>
            <p className="mt-2 text-3xl font-black text-emerald-700 dark:text-emerald-300">
              ₹{totalPlatformDonated.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
              Donated across all member rounds
            </p>
          </div>

          {/* Card 2: Your Total Contribution */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Your Contribution
              </span>
              <span className="text-base">🤝</span>
            </div>
            <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
              ₹{userTotalDonated.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium truncate">
              To {selectedCharityObj?.name || "selected cause"}
            </p>
          </div>

          {/* Card 3: Your Percentage */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Your Giving Rate
              </span>
              <span className="text-base">📈</span>
            </div>
            <p className="mt-2 text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {percentage}%
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Of every monthly subscription fee
            </p>
          </div>

          {/* Card 4: Active Golfer Supporters */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Active Donors
              </span>
              <span className="text-base">👥</span>
            </div>
            <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
              {activeSupportersCount} Golfers
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Contributing to verified causes
            </p>
          </div>
        </div>

        {/* ============================================================== */}
        {/* CHARITY SELECTION FORM                                         */}
        {/* ============================================================== */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
              Select Your Charity Cause
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Choose which foundation receives your subscription contribution. You can change this at any time.
            </p>
          </div>

          {/* Charity List Options */}
          <div className="mt-6 space-y-3">
            {charities.length === 0 ? (
              <p className="text-sm text-slate-500">No active charities found.</p>
            ) : (
              charities.map((charity) => {
                const isSelected = selectedCharity === charity.id;
                return (
                  <label
                    key={charity.id}
                    className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/40 dark:border-emerald-500 dark:bg-emerald-950/20"
                        : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="charity"
                      value={charity.id}
                      checked={isSelected}
                      onChange={(e) => setSelectedCharity(e.target.value)}
                      className="mt-1 h-4 w-4 accent-emerald-600 cursor-pointer"
                    />

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 dark:text-white">
                            {charity.name}
                          </h3>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            Verified Cause ✓
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            👥 {charity.supporters_count || 0} supporters
                          </span>

                          {isSelected && (
                            <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                              Selected Cause
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        {charity.description}
                      </p>

                      <div className="mt-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Total Raised: ₹{(charity.total_raised || 0).toLocaleString()} from community members
                      </div>
                    </div>
                  </label>
                );
              })
            )}
          </div>

          {/* Contribution Percentage Dropdown (PRD: Min 10%) */}
          <div className="mt-8 rounded-xl border border-slate-200/80 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-800/40">
            <label className="block text-sm font-bold text-slate-900 dark:text-white">
              Charity Contribution Percentage
            </label>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Minimum contribution is 10% of subscription fees. You can choose to contribute more.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <select
                value={percentage}
                onChange={(e) => setPercentage(Number(e.target.value))}
                className="w-full sm:w-48 rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-emerald-400 cursor-pointer"
              >
                <option value={10}>10% (Default Min)</option>
                <option value={20}>20%</option>
                <option value={30}>30%</option>
                <option value={40}>40%</option>
                <option value={50}>50%</option>
                <option value={75}>75%</option>
                <option value={100}>100%</option>
              </select>

              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {percentage}% will go to {selectedCharityObj?.name || "your chosen charity"}
              </span>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Saving..." : "Save Charity & Percentage"}
            </button>
          </div>

          {message && (
            <div
              className={`mt-4 rounded-xl p-3.5 text-sm font-semibold ${
                message.includes("successfully")
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"
                  : "border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400"
              }`}
            >
              {message}
            </div>
          )}

          {/* Make an Independent Donation Section */}
          <div className="mt-10 rounded-2xl border border-rose-200/80 bg-rose-50/40 p-6 dark:border-rose-900/40 dark:bg-rose-950/20">
            <div className="flex items-center gap-2">
              <span className="text-xl">❤️</span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Make an Independent Donation
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Want to support {selectedCharityObj?.name || "your charity"} beyond monthly subscription allocations? Send a direct voluntary contribution anytime.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-500">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  placeholder="500"
                  className="w-40 rounded-xl border border-slate-300 bg-white py-2.5 pl-8 pr-4 font-bold text-slate-900 shadow-xs outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (!selectedCharity) {
                    alert("Please select a charity first from the cards above.");
                    return;
                  }
                  setDonating(true);
                  try {
                    const response = await fetch("/api/stripe/create-donation-session", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        charity_id: selectedCharity,
                        amount: Number(donationAmount),
                      }),
                    });
                    const data = await response.json();
                    if (!response.ok) {
                      alert(data.error || "Unable to start donation.");
                      setDonating(false);
                      return;
                    }
                    window.location.href = data.url;
                  } catch {
                    alert("Something went wrong initiating donation.");
                    setDonating(false);
                  }
                }}
                disabled={donating || !donationAmount || Number(donationAmount) < 1}
                className="rounded-xl bg-slate-950 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 cursor-pointer dark:bg-rose-600 dark:hover:bg-rose-500 transition"
              >
                {donating ? "Processing…" : `Donate ₹${donationAmount || 0} Directly`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
