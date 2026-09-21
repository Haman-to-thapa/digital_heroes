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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (adminProfile?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Attempt to select all columns; if updated_at/charity_percentage not yet migrated in Supabase, fallback safely
    let users: any[] | null = null;
    const { data: initialUsers, error: initialError } = await supabaseAdmin
      .from("profiles")
      .select(`
        id,
        full_name,
        role,
        charity_id,
        charity_percentage,
        created_at,
        updated_at
      `)
      .order("created_at", { ascending: false });

    if (initialError) {
      // Fallback in case updated_at or charity_percentage are not yet added to profiles table
      const { data: fallbackUsers, error: fallbackError } = await supabaseAdmin
        .from("profiles")
        .select(`
          id,
          full_name,
          role,
          charity_id,
          created_at
        `)
        .order("created_at", { ascending: false });

      if (fallbackError) {
        return NextResponse.json(
          { error: fallbackError.message },
          { status: 500 }
        );
      }
      users = fallbackUsers;
    } else {
      users = initialUsers;
    }

    const enrichedUsers = await Promise.all(
      (users || []).map(async (profile) => {
        const { data: subscription } = await supabaseAdmin
          .from("subscriptions")
          .select("status, plan_type, current_period_end")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { count: scoreCount } = await supabaseAdmin
          .from("scores")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("user_id", profile.id);

        const { data: charity } = profile.charity_id
          ? await supabaseAdmin
              .from("charities")
              .select("name")
              .eq("id", profile.charity_id)
              .maybeSingle()
          : { data: null };

        return {
          ...profile,
          charity_name: charity?.name || null,
          charity_percentage: profile.charity_percentage ?? 10,
          subscription_status: subscription?.status || "inactive",
          subscription_plan: subscription?.plan_type || null,
          renewal_date: subscription?.current_period_end || null,
          score_count: scoreCount || 0,
        };
      })
    );

    return NextResponse.json({
      users: enrichedUsers,
    });
  } catch (error) {
    console.error("Admin users error:", error);

    return NextResponse.json(
      { error: "Unable to fetch users." },
      { status: 500 }
    );
  }
}
