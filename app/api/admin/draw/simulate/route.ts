import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function generateUniqueNumbers(count: number) {
  const numbers = new Set<number>();

  while (numbers.size < count) {
    const number = Math.floor(Math.random() * 45) + 1;
    numbers.add(number);
  }

  return Array.from(numbers).sort((a, b) => a - b);
}

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

    // Check admin role
    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Current month
    const now = new Date();

    const drawMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
    )
      .toISOString()
      .split("T")[0];

    // Find current draw
    const { data: draw, error: drawError } =
      await supabaseAdmin
        .from("draws")
        .select("id, draw_type, status")
        .eq("draw_month", drawMonth)
        .maybeSingle();

    if (drawError) {
      return NextResponse.json(
        { error: drawError.message },
        { status: 500 }
      );
    }

    let currentDraw = draw;
    if (!currentDraw) {
      const { data: newDraw, error: createError } = await supabaseAdmin
        .from("draws")
        .insert({
          draw_month: drawMonth,
          draw_type: "random",
          status: "draft",
          total_prize_pool: 0,
        })
        .select("id, draw_type, status")
        .single();

      if (createError) {
        return NextResponse.json(
          { error: createError.message },
          { status: 500 }
        );
      }
      currentDraw = newDraw;
    }

    if (currentDraw.status === "published") {
      return NextResponse.json(
        { error: "Published draw cannot be simulated again" },
        { status: 400 }
      );
    }

    // Generate 5 unique winning numbers
    const winningNumbers = generateUniqueNumbers(5);

    // Save simulation result
    const { data: updatedDraw, error: updateError } =
      await supabaseAdmin
        .from("draws")
        .update({
          draw_type: currentDraw.draw_type || "random",
          status: "simulated",
          winning_numbers: winningNumbers,
        })
        .eq("id", currentDraw.id)
        .select()
        .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Draw simulated successfully",
      draw: updatedDraw,
    });
  } catch (error) {
    console.error("Draw simulation error:", error);

    return NextResponse.json(
      { error: "Unable to simulate draw" },
      { status: 500 }
    );
  }
}
