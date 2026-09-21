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

    // 1. Fetch all winners
    const { data: winners, error: winnersError } = await supabaseAdmin
      .from("winners")
      .select("*, draws(draw_month)")
      .order("created_at", { ascending: false });

    if (winnersError) {
      return NextResponse.json({ error: winnersError.message }, { status: 500 });
    }

    if (!winners || winners.length === 0) {
      return NextResponse.json({ winners: [] });
    }

    // 2. Fetch profiles
    const userIds = Array.from(new Set(winners.map((w) => w.user_id)));
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    // 3. Fetch proofs
    const winnerIds = winners.map((w) => w.id);
    const { data: proofs } = await supabaseAdmin
      .from("winner_proofs")
      .select("id, winner_id, file_url, reviewed_at, review_note")
      .in("winner_id", winnerIds);

    // Generate signed URLs for proofs
    const proofsWithUrls = await Promise.all(
      (proofs || []).map(async (proof) => {
        let signedUrl = "";
        try {
          const { data: signed } = await supabaseAdmin.storage
            .from("winner-proofs")
            .createSignedUrl(proof.file_url, 3600);
          signedUrl = signed?.signedUrl || "";
        } catch {
          signedUrl = "";
        }
        return {
          ...proof,
          signedUrl,
        };
      })
    );

    const enrichedWinners = winners.map((w) => {
      const userProfile = profiles?.find((p) => p.id === w.user_id);
      const winnerProof = proofsWithUrls.find((p) => p.winner_id === w.id);
      return {
        ...w,
        full_name: userProfile?.full_name || "Golfer Member",
        draw_month: w.draws?.draw_month || null,
        proof: winnerProof || null,
      };
    });

    return NextResponse.json({ winners: enrichedWinners });
  } catch (error) {
    console.error("Fetch winners error:", error);
    return NextResponse.json({ error: "Failed to fetch winners" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
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

    const body = await request.json();
    const { winnerId, verification_status, payout_status } = body;

    if (!winnerId) {
      return NextResponse.json({ error: "Winner ID required" }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (verification_status) updatePayload.verification_status = verification_status;
    if (payout_status) updatePayload.payout_status = payout_status;

    const { data: updatedWinner, error } = await supabaseAdmin
      .from("winners")
      .update(updatePayload)
      .eq("id", winnerId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: `Winner updated to ${verification_status || payout_status}`,
      winner: updatedWinner,
    });
  } catch (error) {
    console.error("Update winner error:", error);
    return NextResponse.json({ error: "Failed to update winner" }, { status: 500 });
  }
}
