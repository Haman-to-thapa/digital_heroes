import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { count: totalUsers } =
      await supabaseAdmin
        .from("profiles")
        .select("*", {
          count: "exact",
          head: true,
        });

    const { data: draws } =
      await supabaseAdmin
        .from("draws")
        .select(
          "id, draw_month, status, total_prize_pool, five_match_pool, four_match_pool, three_match_pool"
        )
        .order("draw_month", { ascending: false });

    const totalPrizePool =
      draws?.reduce(
        (sum, draw) =>
          sum + Number(draw.total_prize_pool || 0),
        0
      ) || 0;

    const { data: donations } =
      await supabaseAdmin
        .from("donations")
        .select("amount");

    const totalCharity =
      donations?.reduce(
        (sum, donation) =>
          sum + Number(donation.amount || 0),
        0
      ) || 0;

    const { count: totalWinners } =
      await supabaseAdmin
        .from("winners")
        .select("*", {
          count: "exact",
          head: true,
        });

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalPrizePool,
      totalCharity,
      totalDraws: draws?.length || 0,
      totalWinners: totalWinners || 0,
      draws: draws || [],
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Unable to load reports." },
      { status: 500 }
    );
  }
}
