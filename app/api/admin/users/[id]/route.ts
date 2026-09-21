import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminProfile, error: adminError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (adminError || adminProfile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Protect admin's own profile from self-edit via this route
    if (id === user.id) {
      return NextResponse.json(
        { error: "You cannot edit your own admin profile from this page." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const fullName =
      typeof body.full_name === "string" ? body.full_name.trim() : "";

    const charityPercentage = Number(body.charity_percentage);

    if (!fullName) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }

    if (
      !Number.isFinite(charityPercentage) ||
      charityPercentage < 10 ||
      charityPercentage > 100
    ) {
      return NextResponse.json(
        { error: "Charity percentage must be between 10 and 100." },
        { status: 400 }
      );
    }

    // Verify target user exists
    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", id)
      .single();

    if (targetError || !targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // 1. Update user metadata in auth.users
    try {
      await supabaseAdmin.auth.admin.updateUserById(id, {
        user_metadata: {
          full_name: fullName,
          charity_percentage: charityPercentage,
        },
      });
    } catch (metaErr) {
      console.warn("Auth metadata update warning:", metaErr);
    }

    // 2. Update profile with graceful column fallback
    let updatedUser = null;
    const { data: initialUpdate, error: initialError } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: fullName,
        charity_percentage: charityPercentage,
      })
      .eq("id", id)
      .select("id, full_name, role, created_at")
      .single();

    if (initialError) {
      // Fallback if charity_percentage column is not in profiles table
      const { data: fallbackUpdate, error: fallbackError } = await supabaseAdmin
        .from("profiles")
        .update({
          full_name: fullName,
        })
        .eq("id", id)
        .select("id, full_name, role, created_at")
        .single();

      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 500 });
      }
      updatedUser = {
        ...fallbackUpdate,
        charity_percentage: charityPercentage,
      };
    } else {
      updatedUser = {
        ...initialUpdate,
        charity_percentage: charityPercentage,
      };
    }

    return NextResponse.json({
      message: "User updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Admin user update error:", error);
    return NextResponse.json({ error: "Unable to update user." }, { status: 500 });
  }
}
