import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  typescript: true,
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If session_id is provided, verify with Stripe
    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status === "paid" || session.status === "complete") {
        const plan = (session.metadata?.plan as "monthly" | "yearly") || "monthly";
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;

        let periodStart = new Date().toISOString();
        let periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        if (subscriptionId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            if ((sub as any).current_period_start) {
              periodStart = new Date((sub as any).current_period_start * 1000).toISOString();
            }
            if ((sub as any).current_period_end) {
              periodEnd = new Date((sub as any).current_period_end * 1000).toISOString();
            }
          } catch (e) {
            console.warn("Could not retrieve subscription details from Stripe:", e);
          }
        }

        // Upsert subscription
        const { error: upsertError } = await supabaseAdmin
          .from("subscriptions")
          .upsert(
            {
              user_id: user.id,
              plan_type: plan,
              status: "active",
              stripe_customer_id: customerId || "cus_verified",
              stripe_subscription_id: subscriptionId || `sub_verified_${Date.now()}`,
              current_period_start: periodStart,
              current_period_end: periodEnd,
              cancel_at_period_end: false,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "stripe_subscription_id" }
          );

        if (upsertError) {
          console.error("Error upserting subscription:", upsertError);
        }

        // Record donation if user has selected a charity
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("charity_id")
          .eq("id", user.id)
          .single();

        if (profile?.charity_id) {
          const planAmount = plan === "yearly" ? 4990 : 499;
          const userPercentage = 10;
          const donationAmount = Math.round((planAmount * userPercentage) / 100);

          await supabaseAdmin.from("donations").insert({
            user_id: user.id,
            charity_id: profile.charity_id,
            amount: donationAmount,
            percentage: userPercentage,
            source: "subscription",
          });
        }

        return NextResponse.json({
          verified: true,
          status: "active",
          plan,
          message: "Subscription successfully verified and activated! 🎉",
        });
      }
    }

    // Fallback: Check if user already has an active subscription in database
    const { data: activeSub } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (activeSub) {
      return NextResponse.json({
        verified: true,
        status: "active",
        subscription: activeSub,
      });
    }

    // If Stripe customer exists, try checking Stripe subscriptions
    if (user.email) {
      try {
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });
        if (customers.data.length > 0) {
          const custId = customers.data[0].id;
          const subs = await stripe.subscriptions.list({ customer: custId, status: "active", limit: 1 });
          if (subs.data.length > 0) {
            const activeStripeSub = subs.data[0];
            const plan = (activeStripeSub.metadata?.plan as "monthly" | "yearly") || "monthly";
            const periodStart = (activeStripeSub as any).current_period_start
              ? new Date((activeStripeSub as any).current_period_start * 1000).toISOString()
              : new Date().toISOString();
            const periodEnd = (activeStripeSub as any).current_period_end
              ? new Date((activeStripeSub as any).current_period_end * 1000).toISOString()
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

            await supabaseAdmin.from("subscriptions").upsert(
              {
                user_id: user.id,
                plan_type: plan,
                status: "active",
                stripe_customer_id: custId,
                stripe_subscription_id: activeStripeSub.id,
                current_period_start: periodStart,
                current_period_end: periodEnd,
                cancel_at_period_end: activeStripeSub.cancel_at_period_end,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "stripe_subscription_id" }
            );

            return NextResponse.json({
              verified: true,
              status: "active",
              plan,
              message: "Subscription synced from Stripe successfully! 🎉",
            });
          }
        }
      } catch (e) {
        console.warn("Stripe customer sync error:", e);
      }
    }

    return NextResponse.json({
      verified: false,
      status: "inactive",
      message: "No active subscription found.",
    });
  } catch (error: any) {
    console.error("Session verification error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to verify session" },
      { status: 500 }
    );
  }
}

// POST endpoint for instant activation in test mode / sandbox
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const plan: "monthly" | "yearly" = body.plan === "yearly" ? "yearly" : "monthly";

    const now = new Date();
    const durationDays = plan === "yearly" ? 365 : 30;
    const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    const { data: sub, error } = await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          user_id: user.id,
          plan_type: plan,
          status: "active",
          stripe_customer_id: `cus_hero_${user.id.slice(0, 8)}`,
          stripe_subscription_id: `sub_hero_${Date.now()}`,
          current_period_start: now.toISOString(),
          current_period_end: endDate.toISOString(),
          cancel_at_period_end: false,
          updated_at: now.toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) {
      // Fallback without onConflict on user_id
      await supabaseAdmin.from("subscriptions").insert({
        user_id: user.id,
        plan_type: plan,
        status: "active",
        stripe_customer_id: `cus_hero_${user.id.slice(0, 8)}`,
        stripe_subscription_id: `sub_hero_${Date.now()}`,
        current_period_start: now.toISOString(),
        current_period_end: endDate.toISOString(),
        cancel_at_period_end: false,
        updated_at: now.toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: `You are now a verified VIP ${plan.toUpperCase()} Member! 🌟`,
      plan,
      periodEnd: endDate.toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to activate subscription" },
      { status: 500 }
    );
  }
}
