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

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  { params }: Params
) {
  try {
    const auth = await checkAdmin();

    if ("error" in auth) {
      return auth.error;
    }

    const { id } = await params;
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

    if (!name || !slug) {
      return NextResponse.json(
        {
          error:
            "Name and slug are required.",
        },
        { status: 400 }
      );
    }

    const updatePayload: Record<string, any> = {
      name,
      slug,
      description: description || null,
      image_url: imageUrl || null,
      upcoming_event: upcomingEvent || null,
      is_featured: Boolean(body.is_featured),
      is_active:
        body.is_active === undefined
          ? true
          : Boolean(body.is_active),
    };

    const { data, error } = await supabaseAdmin
      .from("charities")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          {
            error:
              "A charity with this slug already exists.",
          },
          { status: 409 }
        );
      }

      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Charity not found." },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Charity updated successfully.",
      charity: data,
    });
  } catch (error) {
    console.error("Admin charity PATCH error:", error);

    return NextResponse.json(
      { error: "Unable to update charity." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: Params
) {
  try {
    const auth = await checkAdmin();

    if ("error" in auth) {
      return auth.error;
    }

    const { id } = await params;

    const { data: charity, error: findError } =
      await supabaseAdmin
        .from("charities")
        .select("id")
        .eq("id", id)
        .single();

    if (findError || !charity) {
      return NextResponse.json(
        { error: "Charity not found." },
        { status: 404 }
      );
    }

    const { error } = await supabaseAdmin
      .from("charities")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Charity deleted successfully.",
    });
  } catch (error) {
    console.error("Admin charity DELETE error:", error);

    return NextResponse.json(
      { error: "Unable to delete charity." },
      { status: 500 }
    );
  }
}
