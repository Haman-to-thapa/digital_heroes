import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia" as any,
});

export async function POST() {
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

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("id, stripe_subscription_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json(
        {
          error: "No active subscription found.",
        },
        { status: 404 }
      );
    }

    // Update Stripe subscription to cancel at period end
    await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      {
        cancel_at_period_end: true,
      }
    );

    // Record in database
    await supabaseAdmin
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
      })
      .eq("id", subscription.id);

    return NextResponse.json({
      message: "Subscription cancellation scheduled at period end.",
    });
  } catch (error: any) {
    console.error("Cancel subscription error:", error);

    return NextResponse.json(
      {
        error: error?.message || "Unable to cancel subscription.",
      },
      { status: 500 }
    );
  }
}
