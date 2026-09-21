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

    // Check admin role
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
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
    )
      .toISOString()
      .split("T")[0];

    // Get current draw
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

    // Must be simulated first
    if (draw.status !== "simulated") {
      return NextResponse.json(
        {
          error:
            "The draw must be simulated before it can be published.",
        },
        { status: 400 }
      );
    }

    if (
      !draw.winning_numbers ||
      draw.winning_numbers.length !== 5
    ) {
      return NextResponse.json(
        { error: "Winning numbers are missing." },
        { status: 400 }
      );
    }

    // Publish draw
    const { data: updatedDraw, error: updateError } =
      await supabaseAdmin
        .from("draws")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
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
      message: "Draw published successfully.",
      draw: updatedDraw,
    });
  } catch (error) {
    console.error("Publish draw error:", error);

    return NextResponse.json(
      { error: "Unable to publish draw" },
      { status: 500 }
    );
  }
}
