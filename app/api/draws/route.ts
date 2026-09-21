import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("draws")
      .select("id, draw_month, winning_numbers, published_at")
      .eq("status", "published")
      .order("draw_month", {
        ascending: false,
      });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      draws: data || [],
    });
  } catch (error) {
    console.error("Public draws fetch error:", error);
    return NextResponse.json(
      { error: "Unable to fetch draw results." },
      { status: 500 }
    );
  }
}
