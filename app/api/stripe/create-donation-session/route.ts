import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia" as any,
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please login first." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const charityId = body.charity_id;
    const amount = Number(body.amount);

    if (!charityId) {
      return NextResponse.json(
        { error: "Charity is required." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(amount) || amount < 1) {
      return NextResponse.json(
        { error: "Minimum donation is ₹1." },
        { status: 400 }
      );
    }

    const origin = new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: "Digital Heroes Charity Donation",
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "donation",
        user_id: user.id,
        charity_id: charityId,
        amount: String(amount),
      },
      success_url: `${origin}/dashboard/charity?donation=success`,
      cancel_url: `${origin}/dashboard/charity?donation=cancelled`,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error: any) {
    console.error("Create donation session error:", error);

    return NextResponse.json(
      { error: error?.message || "Unable to start donation." },
      { status: 500 }
    );
  }
}
