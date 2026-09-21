import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

async function checkAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return {
      error: NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      ),
    };
  }

  return { user };
}

export async function GET() {
  try {
    const auth = await checkAdmin();

    if ("error" in auth) {
      return auth.error;
    }

    const { data, error } = await supabaseAdmin
      .from("charities")
      .select(
        "id, name, slug, description, image_url, upcoming_event, is_featured, is_active, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      charities: data || [],
    });
  } catch (error) {
    console.error("Admin charity GET error:", error);

    return NextResponse.json(
      { error: "Unable to fetch charities." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await checkAdmin();

    if ("error" in auth) {
      return auth.error;
    }

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const slug =
      typeof body.slug === "string"
        ? body.slug.trim().toLowerCase()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const imageUrl =
      typeof body.image_url === "string"
        ? body.image_url.trim()
        : "";

    const upcomingEvent =
      typeof body.upcoming_event === "string"
        ? body.upcoming_event.trim()
        : "";

    const isFeatured = Boolean(body.is_featured);
    const isActive =
      body.is_active === undefined
        ? true
        : Boolean(body.is_active);

    if (!name) {
      return NextResponse.json(
        { error: "Charity name is required." },
        { status: 400 }
      );
    }

    if (!slug) {
      return NextResponse.json(
        { error: "Slug is required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("charities")
      .insert({
        name,
        slug,
        description: description || null,
        image_url: imageUrl || null,
        upcoming_event: upcomingEvent || null,
        is_featured: isFeatured,
        is_active: isActive,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A charity with this slug already exists." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Charity created successfully.",
      charity: data,
    });
  } catch (error) {
    console.error("Admin charity POST error:", error);

    return NextResponse.json(
      { error: "Unable to create charity." },
      { status: 500 }
    );
  }
}
