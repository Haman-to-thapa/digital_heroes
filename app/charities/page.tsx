"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Charity = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  upcoming_event: string | null;
  is_featured: boolean;
};

export default function CharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchCharities() {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("charities")
      .select(
        "id, name, slug, description, image_url, upcoming_event, is_featured"
      )
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("name", { ascending: true });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setCharities(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchCharities();
  }, []);

  const filteredCharities = charities.filter((charity) =>
    charity.name.toLowerCase().includes(search.toLowerCase())
  );

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
    <main className="min-h-full px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
            GIVE BACK
          </span>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Charity Directory 🎗️
          </h1>

          <p className="mt-2 max-w-2xl text-gray-600 dark:text-gray-400">
            Support a verified cause that matters to you while participating in the Digital Heroes Golf Sweepstakes.
          </p>
        </div>

        {/* Search */}
        <div className="mt-6">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search charities by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pl-10 text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-emerald-400"
            />
            <svg
              className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Featured Section */}
        {charities.some((charity) => charity.is_featured) && (
          <section className="mt-10">
            <div className="flex items-center space-x-2">
              <span className="text-xl">⭐</span>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Featured Charity
              </h2>
            </div>

            {charities
              .filter((charity) => charity.is_featured)
              .slice(0, 1)
              .map((charity) => (
                <div
                  key={charity.id}
                  className="mt-4 overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900 md:flex"
                >
                  {charity.image_url && (
                    <img
                      src={charity.image_url}
                      alt={charity.name}
                      className="h-64 w-full object-cover md:h-auto md:w-2/5"
                    />
                  )}

                  <div className="flex flex-col justify-between p-6 sm:p-8 md:w-3/5">
                    <div>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950/70 dark:text-amber-400">
                        Featured Partner
                      </span>

                      <h3 className="mt-4 text-2xl font-extrabold text-gray-900 dark:text-white sm:text-3xl">
                        {charity.name}
                      </h3>

                      <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                        {charity.description}
                      </p>
                    </div>

                    {charity.upcoming_event && (
                      <div className="mt-6 rounded-xl bg-emerald-50/70 p-4 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/60">
                        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                          Upcoming Event
                        </p>
                        <p className="mt-1 text-sm font-bold text-emerald-900 dark:text-emerald-200">
                          {charity.upcoming_event}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </section>
        )}

        {/* All Charities Grid */}
        <section className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              All Charities
            </h2>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {filteredCharities.length} available
            </span>
          </div>

          {filteredCharities.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-500 dark:border-gray-800 dark:text-gray-400">
              No charities found matching &ldquo;{search}&rdquo;.
            </div>
          ) : (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCharities.map((charity) => (
                <div
                  key={charity.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition hover:shadow-md hover:-translate-y-0.5 duration-200 dark:border-gray-800 dark:bg-gray-900"
                >
                  {charity.image_url && (
                    <img
                      src={charity.image_url}
                      alt={charity.name}
                      className="h-48 w-full object-cover"
                    />
                  )}

                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      {charity.is_featured && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                          Featured
                        </span>
                      )}

                      <h3 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
                        {charity.name}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400 line-clamp-3">
                        {charity.description}
                      </p>
                    </div>

                    {charity.upcoming_event && (
                      <div className="mt-4 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Upcoming Event
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-gray-900 dark:text-gray-200">
                          {charity.upcoming_event}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
