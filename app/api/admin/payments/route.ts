import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();

    // Check logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // 1. Fetch all subscriptions from database
    const { data: subscriptions, error: subsError } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .order("created_at", { ascending: false });

    if (subsError) {
      return NextResponse.json({ error: subsError.message }, { status: 500 });
    }

    // 2. Fetch profiles for user names and emails
    const userIds = Array.from(new Set((subscriptions || []).map((s) => s.user_id)));
    
    let profilesMap: Record<string, { full_name: string | null; email?: string }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      // Also get auth users for emails
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 1000,
      });

      const emailMap: Record<string, string> = {};
      authUsers?.users?.forEach((u) => {
        if (u.email) emailMap[u.id] = u.email;
      });

      profiles?.forEach((p) => {
        profilesMap[p.id] = {
          full_name: p.full_name,
          email: emailMap[p.id] || "golfer@example.com",
        };
      });
    }

    // 3. Transform into payment records
    // Pricing: monthly = ₹499, yearly = ₹4,999
    const payments = (subscriptions || []).map((sub) => {
      const userMeta = profilesMap[sub.user_id] || {
        full_name: "Golfer Member",
        email: "member@example.com",
      };

      const amount = sub.plan_type === "yearly" ? 4999 : 499;

      return {
        id: sub.id,
        user_id: sub.user_id,
        user_name: userMeta.full_name || userMeta.email?.split("@")[0] || "Golfer",
        user_email: userMeta.email || "Unknown",
        plan_type: sub.plan_type,
        amount,
        currency: "INR",
        status: sub.status === "active" ? "paid" : sub.status,
        stripe_customer_id: sub.stripe_customer_id,
        stripe_subscription_id: sub.stripe_subscription_id,
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        payment_date: sub.created_at,
      };
    });

    // 4. Aggregate Revenue Metrics
    const totalRevenue = payments
      .filter((p) => p.status === "paid" || p.status === "active")
      .reduce((acc, curr) => acc + curr.amount, 0);

    const activeCount = payments.filter(
      (p) => p.status === "paid" || p.status === "active"
    ).length;

    const monthlyCount = payments.filter(
      (p) => (p.status === "paid" || p.status === "active") && p.plan_type === "monthly"
    ).length;

    const yearlyCount = payments.filter(
      (p) => (p.status === "paid" || p.status === "active") && p.plan_type === "yearly"
    ).length;

    const mrr = monthlyCount * 499 + Math.round((yearlyCount * 4999) / 12);

    return NextResponse.json({
      metrics: {
        totalRevenue,
        mrr,
        activeSubscriptions: activeCount,
        monthlyCount,
        yearlyCount,
        totalTransactions: payments.length,
      },
      payments,
    });
  } catch (error) {
    console.error("Admin payments error:", error);
    return NextResponse.json({ error: "Failed to load payment transactions" }, { status: 500 });
  }
}
