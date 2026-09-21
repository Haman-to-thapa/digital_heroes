import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  typescript: true,
});

export async function POST(request: Request) {
  try {
    const { plan } = await request.json();

    if (plan !== "monthly" && plan !== "yearly") {
      return NextResponse.json(
        { error: "Invalid subscription plan" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please login first" },
        { status: 401 }
      );
    }

    const priceId =
      plan === "monthly"
        ? process.env.STRIPE_MONTHLY_PRICE_ID
        : process.env.STRIPE_YEARLY_PRICE_ID;

    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe price ID is missing. Please configure STRIPE_MONTHLY_PRICE_ID and STRIPE_YEARLY_PRICE_ID in .env.local" },
        { status: 500 }
      );
    }

    const origin = new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: user.email ?? undefined,
      metadata: {
        user_id: user.id,
        plan,
      },
      success_url: `${origin}/dashboard/subscription?success=true`,
      cancel_url: `${origin}/dashboard/subscription?cancelled=true`,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);

    return NextResponse.json(
      { error: error?.message || "Unable to create checkout session" },
      { status: 500 }
    );
  }
}
