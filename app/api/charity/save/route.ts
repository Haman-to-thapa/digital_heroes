import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Verify logged-in user via cookies
    let {
      data: { user },
    } = await supabase.auth.getUser();

    // Fallback: Verify via Authorization header if provided
    if (!user) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const { data: tokenUser } = await supabaseAdmin.auth.getUser(token);
        user = tokenUser?.user || null;
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in first." },
        { status: 401 }
      );
    }

    const { charity_id, percentage } = await request.json();

    if (!charity_id) {
      return NextResponse.json(
        { error: "Please select a charity." },
        { status: 400 }
      );
    }

    const contributionPercentage = Number(percentage) || 10;

    // 2. Verify charity exists
    const { data: charity, error: charityError } = await supabaseAdmin
      .from("charities")
      .select("id, name")
      .eq("id", charity_id)
      .single();

    if (charityError || !charity) {
      return NextResponse.json(
        { error: "Selected charity is invalid or does not exist." },
        { status: 400 }
      );
    }

    // 3. Update profiles table using supabaseAdmin (bypasses client RLS)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        charity_id,
      })
      .eq("id", user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
      return NextResponse.json(
        { error: profileError.message || "Failed to update profile." },
        { status: 500 }
      );
    }

    // 4. Update auth user metadata for charity & percentage
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...(user.user_metadata || {}),
        charity_id,
        charity_percentage: contributionPercentage,
      },
    });

    return NextResponse.json({
      success: true,
      charity_id,
      charity_name: charity.name,
      percentage: contributionPercentage,
      message: `Charity "${charity.name}" and ${contributionPercentage}% contribution saved successfully! 🎉`,
    });
  } catch (error: any) {
    console.error("Save charity API error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
}
