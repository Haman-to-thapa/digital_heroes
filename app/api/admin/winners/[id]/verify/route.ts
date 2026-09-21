import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin role check
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const action: string = body.action;
    const reviewNote: string | null = body.reviewNote || null;

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "Invalid action. Use 'approve' or 'reject'." }, { status: 400 });
    }

    // Verify winner exists
    const { data: winner, error: winnerError } = await supabaseAdmin
      .from("winners")
      .select("id, verification_status, payout_status")
      .eq("id", id)
      .single();

    if (winnerError || !winner) {
      return NextResponse.json({ error: "Winner not found" }, { status: 404 });
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    // Update winner verification_status only
    // payout_status remains "pending" — changed separately in Step 65
    const { error: updateError } = await supabaseAdmin
      .from("winners")
      .update({
        verification_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Save review metadata to winner_proofs (reviewed_at + review_note)
    const { error: proofError } = await supabaseAdmin
      .from("winner_proofs")
      .update({
        reviewed_at: new Date().toISOString(),
        review_note: reviewNote,
      })
      .eq("winner_id", id);

    if (proofError) {
      // Non-fatal — log but don't fail the request
      console.error("winner_proofs review update error:", proofError.message);
    }

    return NextResponse.json({
      message:
        action === "approve"
          ? "Winner proof approved. Payout is now Pending."
          : "Winner proof rejected.",
      verification_status: newStatus,
      payout_status: winner.payout_status, // unchanged
    });
  } catch (error) {
    console.error("Winner verification error:", error);
    return NextResponse.json({ error: "Unable to verify winner." }, { status: 500 });
  }
}
