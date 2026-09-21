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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const now = new Date();
    const drawMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
      .toISOString()
      .split("T")[0];

    // Find current draw
    const { data: draw } = await supabaseAdmin
      .from("draws")
      .select("id")
      .eq("draw_month", drawMonth)
      .maybeSingle();

    if (draw) {
      // Clear winners for this draw
      await supabaseAdmin.from("winners").delete().eq("draw_id", draw.id);

      // Reset draw to draft
      await supabaseAdmin
        .from("draws")
        .update({
          status: "draft",
          winning_numbers: null,
          published_at: null,
          total_prize_pool: 0,
          five_match_pool: 0,
          four_match_pool: 0,
          three_match_pool: 0,
        })
        .eq("id", draw.id);
    }

    return NextResponse.json({
      message: "Draw reset to draft successfully. You can now generate fresh numbers.",
    });
  } catch (error) {
    console.error("Reset draw error:", error);
    return NextResponse.json({ error: "Unable to reset draw" }, { status: 500 });
  }
}
