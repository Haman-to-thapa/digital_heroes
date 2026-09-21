import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  typescript: true,
});

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing stripe signature", {
      status: 400,
    });
  }

  const body = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error("Webhook signature error:", error?.message);

    return new NextResponse(`Invalid webhook signature: ${error?.message}`, {
      status: 400,
    });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.user_id;
      const plan = session.metadata?.plan;

      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id;

      if (!userId || !plan || !subscriptionId) {
        return NextResponse.json({
          received: true,
        });
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      const status =
        subscription.status === "active" || subscription.status === "trialing"
          ? "active"
          : subscription.status === "past_due"
          ? "past_due"
          : "inactive";

      const periodStart = (subscription as any).current_period_start
        ? new Date((subscription as any).current_period_start * 1000).toISOString()
        : new Date().toISOString();

      const periodEnd = (subscription as any).current_period_end
        ? new Date((subscription as any).current_period_end * 1000).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabaseAdmin
        .from("subscriptions")
        .upsert(
          {
            user_id: userId,
            plan_type: plan,
            status,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            current_period_start: periodStart,
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "stripe_subscription_id",
          }
        );

      if (error) {
        console.error("Subscription DB error:", error);

        return NextResponse.json(
          { error: "Database update failed" },
          { status: 500 }
        );
      }
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;

      const status =
        subscription.status === "active" || subscription.status === "trialing"
          ? "active"
          : subscription.status === "past_due"
          ? "past_due"
          : subscription.status === "canceled" || subscription.status === "unpaid"
          ? "lapsed"
          : "inactive";

      const periodStart = (subscription as any).current_period_start
        ? new Date((subscription as any).current_period_start * 1000).toISOString()
        : new Date().toISOString();

      const periodEnd = (subscription as any).current_period_end
        ? new Date((subscription as any).current_period_end * 1000).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      await supabaseAdmin
        .from("subscriptions")
        .update({
          status,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error);

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
