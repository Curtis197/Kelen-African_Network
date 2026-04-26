// app/api/google/feature-reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gbpLog } from "@/lib/logger";

/**
 * POST /api/google/feature-reviews
 * Body: { authorNames: string[] }
 *
 * Persists the professional's review selection to pro_google_reviews_cache.
 * An empty array means "show all reviews" (default behaviour).
 */
export async function POST(request: NextRequest) {
  const log = gbpLog.child("feature-reviews");
  log.info("→ POST /api/google/feature-reviews");

  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: pro } = await supabase
      .from("professionals")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!pro) {
      return NextResponse.json({ error: "Professional not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const authorNames: string[] = Array.isArray(body.authorNames) ? body.authorNames : [];

    const { error } = await supabase
      .from("pro_google_reviews_cache")
      .update({ featured_review_ids: authorNames })
      .eq("pro_id", pro.id);

    if (error) {
      log.error("Failed to update featured_review_ids", { proId: pro.id, error: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    log.info("Featured reviews updated", { proId: pro.id, count: authorNames.length });
    return NextResponse.json({ success: true, count: authorNames.length });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    gbpLog.error("Unhandled error in feature-reviews", { error: msg });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * GET /api/google/feature-reviews
 * Returns the current featured review selection for the logged-in professional.
 */
export async function GET() {
  const log = gbpLog.child("feature-reviews");

  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: pro } = await supabase
      .from("professionals")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!pro) {
      return NextResponse.json({ error: "Professional not found" }, { status: 404 });
    }

    const { data: cache } = await supabase
      .from("pro_google_reviews_cache")
      .select("featured_review_ids")
      .eq("pro_id", pro.id)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      authorNames: (cache?.featured_review_ids as string[]) ?? [],
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
