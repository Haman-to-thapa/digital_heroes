import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const supabase = await createClient();

    // Check logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check admin
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

    // Current month
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

    // Get published draw
    const { data: draw, error: drawError } =
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
      return NextResponse.json(
        { error: "Current draw not found" },
        { status: 404 }
      );
    }

    if (draw.status !== "published") {
      return NextResponse.json(
        { error: "Draw must be published first" },
        { status: 400 }
      );
    }

    const winningNumbers: number[] =
      draw.winning_numbers || [];

    if (winningNumbers.length !== 5) {
      return NextResponse.json(
        { error: "Winning numbers are invalid" },
        { status: 400 }
      );
    }

    // Get all entries
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

    if (!entries || entries.length === 0) {
      return NextResponse.json(
        { error: "No entries found for this draw" },
        { status: 400 }
      );
    }

    const winners = [];

    for (const entry of entries) {
      const entryNumbers = [
        entry.number_1,
        entry.number_2,
        entry.number_3,
        entry.number_4,
        entry.number_5,
      ];

      const matches = entryNumbers.filter((number) =>
        winningNumbers.includes(number)
      ).length;

      // Update match count
      const { error: updateError } =
        await supabaseAdmin
          .from("draw_entries")
          .update({
            matches_count: matches,
          })
          .eq("id", entry.id);

      if (updateError) {
        console.error("Error updating entry matches count:", updateError);
        continue;
      }

      // Only 3, 4 and 5 match are winners
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

    // Clear any previous winner records for this draw if re-calculating
    await supabaseAdmin.from("winners").delete().eq("draw_id", draw.id);

    // Create winner records
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

    return NextResponse.json({
      message: "Draw results calculated successfully.",
      totalEntries: entries.length,
      totalWinners: winners.length,
    });
  } catch (error) {
    console.error("Calculate draw error:", error);

    return NextResponse.json(
      { error: "Unable to calculate draw results" },
      { status: 500 }
    );
  }
}
