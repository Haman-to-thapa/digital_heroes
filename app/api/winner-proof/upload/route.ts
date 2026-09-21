import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please login first." },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const winnerId = formData.get("winner_id");
    const file = formData.get("file");

    if (!winnerId || typeof winnerId !== "string") {
      return NextResponse.json(
        { error: "Winner ID is required." },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Screenshot file is required." },
        { status: 400 }
      );
    }

    // Basic image validation
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Please upload an image file." },
        { status: 400 }
      );
    }

    // Winner must belong to logged-in user
    const { data: winner, error: winnerError } =
      await supabase
        .from("winners")
        .select("id, user_id, verification_status")
        .eq("id", winnerId)
        .eq("user_id", user.id)
        .single();

    if (winnerError || !winner) {
      return NextResponse.json(
        { error: "Winner record not found." },
        { status: 404 }
      );
    }

    // Don't allow proof after approval
    if (winner.verification_status === "approved") {
      return NextResponse.json(
        { error: "This winner has already been approved." },
        { status: 400 }
      );
    }

    const extension =
      file.name.split(".").pop()?.toLowerCase() || "png";

    const filePath = `${user.id}/${winnerId}-${Date.now()}.${extension}`;

    // Upload to private bucket
    const { error: uploadError } =
      await supabaseAdmin.storage
        .from("winner-proofs")
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);

      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    // Save storage path in database
    const { error: proofError } =
      await supabaseAdmin
        .from("winner_proofs")
        .insert({
          winner_id: winnerId,
          file_url: filePath,
        });

    if (proofError) {
      // Remove uploaded file if DB insert fails
      await supabaseAdmin.storage
        .from("winner-proofs")
        .remove([filePath]);

      return NextResponse.json(
        { error: proofError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Winner proof uploaded successfully.",
    });
  } catch (error) {
    console.error("Proof upload error:", error);

    return NextResponse.json(
      { error: "Unable to upload winner proof." },
      { status: 500 }
    );
  }
}
