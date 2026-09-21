import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function randomNumbers() {
  const numbers = new Set<number>();

  while (numbers.size < 5) {
    numbers.add(Math.floor(Math.random() * 45) + 1);
  }

  return Array.from(numbers).sort((a, b) => a - b);
}

function weightedNumbers(scores: number[]) {
  const frequency = new Map<number, number>();

  for (let number = 1; number <= 45; number++) {
    frequency.set(number, 1);
  }

  for (const score of scores) {
    frequency.set(
      score,
      (frequency.get(score) || 1) + 1
    );
  }

  const selected = new Set<number>();

  while (selected.size < 5) {
    let totalWeight = 0;

    for (const [number, weight] of frequency) {
      if (!selected.has(number)) {
        totalWeight += weight;
      }
    }

    let random = Math.random() * totalWeight;

    for (const [number, weight] of frequency) {
      if (selected.has(number)) continue;

      random -= weight;

      if (random <= 0) {
        selected.add(number);
        break;
      }
    }
  }

  return Array.from(selected).sort((a, b) => a - b);
}

export async function POST(request: Request) {
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

    const body = await request.json().catch(() => ({}));

    const requestedType =
      body.draw_type === "algorithmic"
        ? "algorithmic"
        : "random";

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

    let { data: draw, error } =
      await supabaseAdmin
        .from("draws")
        .select("*")
        .eq("draw_month", drawMonth)
        .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Auto-create draw draft if not found for current month
    if (!draw) {
      const { data: newDraw, error: createError } = await supabaseAdmin
        .from("draws")
        .insert({
          draw_month: drawMonth,
          draw_type: requestedType,
          status: "draft",
          total_prize_pool: 0,
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json(
          { error: "Current draw not found and could not be initialized." },
          { status: 404 }
        );
      }
      draw = newDraw;
    }

    if (draw.status === "published") {
      return NextResponse.json(
        { error: "Published draw cannot be simulated." },
        { status: 400 }
      );
    }

    let winningNumbers: number[];

    if (requestedType === "algorithmic") {
      const { data: activeSubscriptions } =
        await supabaseAdmin
          .from("subscriptions")
          .select("user_id")
          .eq("status", "active");

      const userIds = [
        ...new Set(
          (activeSubscriptions || []).map(
            (item) => item.user_id
          )
        ),
      ];

      let scoreValues: number[] = [];

      if (userIds.length > 0) {
        const { data: scoreRows } =
          await supabaseAdmin
            .from("scores")
            .select("score")
            .in("user_id", userIds);

        scoreValues =
          scoreRows?.map((item) => item.score) || [];
      }

      winningNumbers = weightedNumbers(scoreValues);
    } else {
      winningNumbers = randomNumbers();
    }

    const { data: updatedDraw, error: updateError } =
      await supabaseAdmin
        .from("draws")
        .update({
          draw_type: requestedType,
          status: "simulated",
          winning_numbers: winningNumbers,
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
      message: "Draw simulated successfully.",
      draw: updatedDraw,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Unable to simulate draw." },
      { status: 500 }
    );
  }
}
