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

    const { data: draw, error: drawError } =
      await supabaseAdmin
        .from("draws")
        .select("*")
        .eq("draw_month", drawMonth)
        .maybeSingle();

    if (drawError || !draw) {
      return NextResponse.json(
        { error: "Draw not found." },
        { status: 404 }
      );
    }

    if (draw.status !== "published") {
      return NextResponse.json(
        { error: "Draw must be published first." },
        { status: 400 }
      );
    }

    const { data: existingWinners } =
      await supabaseAdmin
        .from("winners")
        .select("id")
        .eq("draw_id", draw.id)
        .limit(1);

    if (existingWinners?.length) {
      return NextResponse.json(
        {
          error:
            "Results have already been calculated for this draw.",
        },
        { status: 409 }
      );
    }

    const winningNumbers: number[] =
      draw.winning_numbers || [];

    const { data: entries, error: entriesError } =
      await supabaseAdmin
        .from("draw_entries")
        .select("*")
        .eq("draw_id", draw.id);

    if (entriesError) {
      return NextResponse.json(
        { error: entriesError.message },
        { status: 500 }
      );
    }

    if (!entries?.length) {
      return NextResponse.json(
        { error: "No draw entries found." },
        { status: 400 }
      );
    }

    const winners = [];

    for (const entry of entries) {
      const numbers = [
        entry.number_1,
        entry.number_2,
        entry.number_3,
        entry.number_4,
        entry.number_5,
      ];

      const matches = numbers.filter((number) =>
        winningNumbers.includes(number)
      ).length;

      await supabaseAdmin
        .from("draw_entries")
        .update({
          matches_count: matches,
        })
        .eq("id", entry.id);

      if (matches >= 3) {
        winners.push({
          draw_id: draw.id,
          user_id: entry.user_id,
          draw_entry_id: entry.id,
          match_type:
            matches === 5
              ? "5_match"
              : matches === 4
              ? "4_match"
              : "3_match",
          prize_amount: 0,
          verification_status: "pending",
          payout_status: "pending",
        });
      }
    }

    if (winners.length > 0) {
      const { error: winnerError } =
        await supabaseAdmin
          .from("winners")
          .insert(winners);

      if (winnerError) {
        return NextResponse.json(
          { error: winnerError.message },
          { status: 500 }
        );
      }
    }

    const fiveMatchWinnerCount =
      winners.filter(
        (winner) => winner.match_type === "5_match"
      ).length;

    const newRollover =
      fiveMatchWinnerCount === 0
        ? Number(draw.five_match_pool || 0)
        : 0;

    await supabaseAdmin
      .from("draws")
      .update({
        jackpot_rollover: newRollover,
      })
      .eq("id", draw.id);

    return NextResponse.json({
      message: "Draw results calculated successfully.",
      totalEntries: entries.length,
      totalWinners: winners.length,
      jackpotRollover: newRollover,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Unable to calculate results." },
      { status: 500 }
    );
  }
}
