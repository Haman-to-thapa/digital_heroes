import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. Get logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 2. Query all real records from `donations` table
    const { data: donations, error: donError } = await supabaseAdmin
      .from("donations")
      .select("id, user_id, charity_id, amount, percentage, created_at");

    if (donError) {
      console.error("Database error fetching donations:", donError);
    }

    const allDonations = donations || [];

    // Total Platform Donated (sum of all amounts in `donations` table)
    const totalPlatformDonated = allDonations.reduce(
      (sum, d) => sum + (Number(d.amount) || 0),
      0
    );

    // User's personal total donated (sum of amounts in `donations` for this user)
    const userTotalDonated = user
      ? allDonations
          .filter((d) => d.user_id === user.id)
          .reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
      : 0;

    // Unique donors count from `donations` table
    const uniqueDonorsSet = new Set(allDonations.map((d) => d.user_id));
    const totalDonorsCount = uniqueDonorsSet.size;

    // 3. Query all profiles to calculate supporter counts per charity
    const { data: allProfiles } = await supabaseAdmin
      .from("profiles")
      .select("id, charity_id");

    const supportersMap: Record<string, number> = {};
    let totalSupportersWithCharity = 0;
    (allProfiles || []).forEach((p) => {
      if (p.charity_id) {
        totalSupportersWithCharity += 1;
        supportersMap[p.charity_id] = (supportersMap[p.charity_id] || 0) + 1;
      }
    });

    // Per-charity donation sum from `donations` table
    const charityRaisedMap: Record<string, number> = {};
    allDonations.forEach((d) => {
      if (d.charity_id) {
        charityRaisedMap[d.charity_id] =
          (charityRaisedMap[d.charity_id] || 0) + (Number(d.amount) || 0);
      }
    });

    // 4. Query active charities from `charities` table
    const { data: charities, error: charityError } = await supabaseAdmin
      .from("charities")
      .select("id, name, description, image_url, is_featured, is_active")
      .eq("is_active", true)
      .order("name");

    if (charityError) {
      console.error("Database error fetching charities:", charityError);
    }

    const enrichedCharities = (charities || []).map((c) => ({
      ...c,
      supporters_count: supportersMap[c.id] || 0,
      total_raised: charityRaisedMap[c.id] || 0,
    }));

    return NextResponse.json({
      totalPlatformDonated,
      userTotalDonated,
      totalDonorsCount,
      activeSupportersCount: totalSupportersWithCharity,
      charities: enrichedCharities,
    });
  } catch (error: any) {
    console.error("Charity impact API error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
}
