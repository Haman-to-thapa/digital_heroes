"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Profile = {
  full_name: string | null;
  role: string;
};

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      setProfile(data);
      setLoading(false);
    }

    getProfile();
  }, [router, supabase]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 font-medium">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Welcome back</p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            {profile?.full_name || "User"}
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Role: <span className="font-semibold capitalize text-black">{profile?.role}</span>
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Subscription</p>
            <h2 className="mt-2 text-xl font-semibold">Inactive</h2>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Golf Scores</p>
            <h2 className="mt-2 text-xl font-semibold">0 / 5</h2>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Draws</p>
            <h2 className="mt-2 text-xl font-semibold">0</h2>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Winnings</p>
            <h2 className="mt-2 text-xl font-semibold">₹0</h2>
          </div>
        </div>
      </div>
    </main>
  );
}
