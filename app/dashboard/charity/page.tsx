"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Charity = {
  id: string;
  name: string;
  description: string | null;
};

export default function CharityPage() {
  const supabase = createClient();
  const router = useRouter();

  const [charities, setCharities] = useState<Charity[]>([]);
  const [selectedCharity, setSelectedCharity] = useState("");
  const [percentage, setPercentage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: charityData } = await supabase
        .from("charities")
        .select("id, name, description")
        .eq("is_active", true)
        .order("name");

      const { data: profileData } = await supabase
        .from("profiles")
        .select("charity_id, charity_percentage")
        .eq("id", user.id)
        .single();

      setCharities(charityData || []);
      setSelectedCharity(profileData?.charity_id || "");
      setPercentage(profileData?.charity_percentage || 10);
      setLoading(false);
    }

    loadData();
  }, [router, supabase]);

  async function handleSave() {
    if (!selectedCharity) {
      setMessage("Please select a charity.");
      return;
    }

    setSaving(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        charity_id: selectedCharity,
        charity_percentage: percentage,
      })
      .eq("id", user.id);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Charity and contribution percentage saved successfully.");
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <main className="min-h-[80vh] flex items-center justify-center">
        <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 font-medium">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <span>Loading charities...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                PRD Step 34
              </span>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Choose Your Charity 🎗️
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Select the charitable cause and set your subscription contribution percentage.
              </p>
            </div>
          </div>

          {/* Charity List Options */}
          <div className="mt-6 space-y-3">
            {charities.map((charity) => {
              const isSelected = selectedCharity === charity.id;
              return (
                <label
                  key={charity.id}
                  className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500 dark:border-emerald-500 dark:bg-emerald-950/20"
                      : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800/60"
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
                    <h2 className="font-bold text-gray-900 dark:text-white">
                      {charity.name}
                    </h2>

                    <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                      {charity.description}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Contribution Percentage Dropdown (PRD: Min 10%) */}
          <div className="mt-8 rounded-xl border border-gray-100 bg-gray-50/80 p-5 dark:border-gray-800 dark:bg-gray-800/40">
            <label className="block text-sm font-bold text-gray-900 dark:text-white">
              Charity Contribution Percentage
            </label>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Minimum contribution is 10% of subscription fees. You can choose to contribute more.
            </p>

            <div className="mt-3 flex items-center gap-3">
              <select
                value={percentage}
                onChange={(e) => setPercentage(Number(e.target.value))}
                className="w-full sm:w-48 rounded-xl border border-gray-300 bg-white px-4 py-2.5 font-semibold text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-emerald-400"
              >
                <option value={10}>10% (Default Min)</option>
                <option value={20}>20%</option>
                <option value={30}>30%</option>
                <option value={40}>40%</option>
                <option value={50}>50%</option>
                <option value={75}>75%</option>
                <option value={100}>100%</option>
              </select>

              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                {percentage}% goes to selected charity
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
              className={`mt-4 rounded-xl p-3 text-sm font-medium ${
                message.includes("successfully")
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400"
              }`}
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
