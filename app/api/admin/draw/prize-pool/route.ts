import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST() {
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

    let { data: draw, error: drawError } =
      await supabaseAdmin
        .from("draws")
        .select("*")
        .eq("draw_month", drawMonth)
        .maybeSingle();

    if (drawError) {
      return NextResponse.json(
        { error: drawError.message },
        { status: 500 }
      );
    }

    if (!draw) {
      const { data: newDraw, error: createError } = await supabaseAdmin
        .from("draws")
        .insert({
          draw_month: drawMonth,
          draw_type: "random",
          status: "draft",
          total_prize_pool: 0,
        })
        .select()
        .single();

      if (createError || !newDraw) {
        return NextResponse.json(
          { error: "Current draw not found and could not be initialized." },
          { status: 500 }
        );
      }
      draw = newDraw;
    }

    // Count distinct active subscribers
    const { data: activeSubscriptions, error: subscriptionError } =
      await supabaseAdmin
        .from("subscriptions")
        .select("user_id")
        .eq("status", "active");

    if (subscriptionError) {
      return NextResponse.json(
        { error: subscriptionError.message },
        { status: 500 }
      );
    }

    const uniqueSubscribers = new Set(
      (activeSubscriptions || []).map((item) => item.user_id)
    );

    const subscriberCount = uniqueSubscribers.size;

    const contributionPerSubscriber = Number(
      process.env.PRIZE_POOL_PER_SUBSCRIBER || 0
    );

    const basePrizePool =
      subscriberCount * contributionPerSubscriber;

    // Previous draw's unclaimed jackpot
    const previousMonth = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() - 1,
        1
      )
    )
      .toISOString()
      .split("T")[0];

    const { data: previousDraw } =
      await supabaseAdmin
        .from("draws")
        .select("jackpot_rollover")
        .eq("draw_month", previousMonth)
        .maybeSingle();

    const previousRollover =
      Number(previousDraw?.jackpot_rollover || 0);

    const fiveMatchPool =
      basePrizePool * 0.40 + previousRollover;

    const fourMatchPool =
      basePrizePool * 0.35;

    const threeMatchPool =
      basePrizePool * 0.25;

    const { data: updatedDraw, error: updateError } =
      await supabaseAdmin
        .from("draws")
        .update({
          total_prize_pool: basePrizePool,
          five_match_pool: fiveMatchPool,
          four_match_pool: fourMatchPool,
          three_match_pool: threeMatchPool,
          jackpot_rollover: previousRollover,
        })
        .eq("id", draw.id)
        .select()
        .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Prize pool calculated successfully.",
      subscriberCount,
      contributionPerSubscriber,
      basePrizePool,
      fiveMatchPool,
      fourMatchPool,
      threeMatchPool,
      draw: updatedDraw,
    });
  } catch (error) {
    console.error("Prize pool error:", error);

    return NextResponse.json(
      { error: "Unable to calculate prize pool" },
      { status: 500 }
    );
  }
}
