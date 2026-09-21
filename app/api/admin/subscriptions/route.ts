import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. Verify logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // 2. Verify admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    // 3. Fetch all subscriptions
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .order("created_at", { ascending: false });

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      return NextResponse.json(
        { error: "Failed to fetch subscriptions." },
        { status: 500 }
      );
    }

    // 4. Fetch profiles & auth users for matching user details
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, role");

    const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
    const authUsers = authData?.users || [];

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    const authUserMap = new Map((authUsers || []).map((u) => [u.id, u]));

    // 5. Combine subscriptions with user profile & email
    const detailedSubscribers = (subscriptions || []).map((sub) => {
      const userProfile = profileMap.get(sub.user_id);
      const authUser = authUserMap.get(sub.user_id);

      return {
        id: sub.id,
        user_id: sub.user_id,
        user_name: userProfile?.full_name || authUser?.user_metadata?.full_name || "Golfer",
        user_email: authUser?.email || "No email",
        user_role: userProfile?.role || "user",
        plan_type: sub.plan_type,
        status: sub.status,
        stripe_customer_id: sub.stripe_customer_id,
        stripe_subscription_id: sub.stripe_subscription_id,
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        cancel_at_period_end: sub.cancel_at_period_end,
        created_at: sub.created_at,
      };
    });

    const activeCount = detailedSubscribers.filter((s) => s.status === "active").length;
    const monthlyCount = detailedSubscribers.filter((s) => s.plan_type === "monthly").length;
    const yearlyCount = detailedSubscribers.filter((s) => s.plan_type === "yearly").length;
    const prizePoolPerSub = Number(process.env.PRIZE_POOL_PER_SUBSCRIBER || 100);

    const stats = {
      totalSubscribers: detailedSubscribers.length,
      activeSubscribers: activeCount,
      monthlySubscribers: monthlyCount,
      yearlySubscribers: yearlyCount,
      prizePoolGenerated: activeCount * prizePoolPerSub,
      prizePoolPerSub,
    };

    return NextResponse.json({
      subscribers: detailedSubscribers,
      stats,
    });
  } catch (error: any) {
    console.error("Admin subscriptions API error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
