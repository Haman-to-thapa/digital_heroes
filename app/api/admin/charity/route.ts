import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();

    // Check logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // 1. Fetch all donations
    const { data: donations, error: donError } = await supabaseAdmin
      .from("donations")
      .select("*, charities(id, name, website_url)")
      .order("created_at", { ascending: false });

    if (donError) {
      return NextResponse.json({ error: donError.message }, { status: 500 });
    }

    // 2. Fetch all charities
    const { data: charities } = await supabaseAdmin
      .from("charities")
      .select("*");

    // 3. Fetch user profiles for donor names and emails
    const userIds = Array.from(new Set((donations || []).map((d) => d.user_id)));
    let userMap: Record<string, { name: string; email: string }> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 1000,
      });

      const emailMap: Record<string, string> = {};
      authUsers?.users?.forEach((u) => {
        if (u.email) emailMap[u.id] = u.email;
      });

      profiles?.forEach((p) => {
        userMap[p.id] = {
          name: p.full_name || emailMap[p.id]?.split("@")[0] || "Golfer Member",
          email: emailMap[p.id] || "golfer@example.com",
        };
      });
    }

    // 4. Calculate Charity Breakdown
    const charityBreakdown = (charities || []).map((charity) => {
      const charityDonations = (donations || []).filter(
        (d) => d.charity_id === charity.id
      );
      const totalAmount = charityDonations.reduce(
        (acc, curr) => acc + Number(curr.amount || 0),
        0
      );
      const uniqueDonors = new Set(charityDonations.map((d) => d.user_id)).size;

      return {
        id: charity.id,
        name: charity.name,
        description: charity.description,
        website_url: charity.website_url,
        totalAmount,
        donationsCount: charityDonations.length,
        uniqueDonors,
      };
    });

    const totalDonationsAmount = (donations || []).reduce(
      (acc, curr) => acc + Number(curr.amount || 0),
      0
    );

    const totalUniqueDonors = new Set((donations || []).map((d) => d.user_id)).size;

    // 5. Enriched donation list
    const enrichedDonations = (donations || []).map((d) => ({
      id: d.id,
      amount: Number(d.amount),
      percentage: d.percentage || 10,
      source: d.source || "sweepstakes",
      charity_name: d.charities?.name || "Global Charity",
      charity_id: d.charity_id,
      donor_name: userMap[d.user_id]?.name || "Golfer Member",
      donor_email: userMap[d.user_id]?.email || "member@example.com",
      created_at: d.created_at,
    }));

    return NextResponse.json({
      metrics: {
        totalDonationsAmount,
        totalDonationsCount: donations?.length || 0,
        totalUniqueDonors,
        totalCharitiesSupported: charities?.length || 0,
      },
      charityBreakdown,
      donations: enrichedDonations,
    });
  } catch (error) {
    console.error("Admin charity error:", error);
    return NextResponse.json({ error: "Failed to load charity data" }, { status: 500 });
  }
}
