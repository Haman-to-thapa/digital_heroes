import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const supabase = await createClient();

    // 1. Check login
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Check admin
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

    // 3. Current month
    const now = new Date();

    const drawMonth = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        1
      )
    )
      .toISOString()
      .split("T")[0];

    // 4. Get draw
    const { data: draw, error: drawError } =
      await supabaseAdmin
        .from("draws")
        .select(
          "id, five_match_pool, four_match_pool, three_match_pool"
        )
        .eq("draw_month", drawMonth)
        .maybeSingle();

    if (drawError) {
      return NextResponse.json(
        { error: drawError.message },
        { status: 500 }
      );
    }

    if (!draw) {
      return NextResponse.json(
        { error: "Current draw not found" },
        { status: 404 }
      );
    }

    // 5. Get winners
    const { data: winners, error: winnersError } =
      await supabaseAdmin
        .from("winners")
        .select("id, match_type")
        .eq("draw_id", draw.id);

    if (winnersError) {
      return NextResponse.json(
        { error: winnersError.message },
        { status: 500 }
      );
    }

    if (!winners || winners.length === 0) {
      return NextResponse.json(
        { error: "No winners found" },
        { status: 400 }
      );
    }

    // 6. Count winners by tier
    const fiveMatchWinners = winners.filter(
      (winner) => winner.match_type === "5_match"
    );

    const fourMatchWinners = winners.filter(
      (winner) => winner.match_type === "4_match"
    );

    const threeMatchWinners = winners.filter(
      (winner) => winner.match_type === "3_match"
    );

    // 7. Calculate individual prizes
    const fivePrize =
      fiveMatchWinners.length > 0
        ? Number(draw.five_match_pool) /
          fiveMatchWinners.length
        : 0;

    const fourPrize =
      fourMatchWinners.length > 0
        ? Number(draw.four_match_pool) /
          fourMatchWinners.length
        : 0;

    const threePrize =
      threeMatchWinners.length > 0
        ? Number(draw.three_match_pool) /
          threeMatchWinners.length
        : 0;

    // 8. Update 5-match winners
    for (const winner of fiveMatchWinners) {
      await supabaseAdmin
        .from("winners")
        .update({
          prize_amount: Number(fivePrize.toFixed(2)),
          updated_at: new Date().toISOString(),
        })
        .eq("id", winner.id);
    }

    // 9. Update 4-match winners
    for (const winner of fourMatchWinners) {
      await supabaseAdmin
        .from("winners")
        .update({
          prize_amount: Number(fourPrize.toFixed(2)),
          updated_at: new Date().toISOString(),
        })
        .eq("id", winner.id);
    }

    // 10. Update 3-match winners
    for (const winner of threeMatchWinners) {
      await supabaseAdmin
        .from("winners")
        .update({
          prize_amount: Number(threePrize.toFixed(2)),
          updated_at: new Date().toISOString(),
        })
        .eq("id", winner.id);
    }

    return NextResponse.json({
      message: "Winner prizes calculated successfully.",

      fiveMatch: {
        winners: fiveMatchWinners.length,
        pool: Number(draw.five_match_pool),
        prizeEach: Number(fivePrize.toFixed(2)),
      },

      fourMatch: {
        winners: fourMatchWinners.length,
        pool: Number(draw.four_match_pool),
        prizeEach: Number(fourPrize.toFixed(2)),
      },

      threeMatch: {
        winners: threeMatchWinners.length,
        pool: Number(draw.three_match_pool),
        prizeEach: Number(threePrize.toFixed(2)),
      },
    });
  } catch (error) {
    console.error("Prize calculation error:", error);

    return NextResponse.json(
      { error: "Unable to calculate winner prizes" },
      { status: 500 }
    );
  }
}
