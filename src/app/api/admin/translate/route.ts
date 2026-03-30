export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { translateText, translateBatch, translateBulk } from "@/lib/translate";

/**
 * POST /api/admin/translate
 *
 * Accepts three formats:
 *
 * 1) Single text:
 *    { text: "...", from: "zh", to: "en" }
 *    → { translated: "..." }
 *
 * 2) Batch (one target):
 *    { texts: { key: "value", ... }, from: "zh", to: "en" }
 *    → { translated: { key: "value", ... } }
 *
 * 3) Bulk (multiple targets):
 *    { texts: { nameZh: "...", descZh: "..." }, from: "zh", targets: ["en","ja","ar"] }
 *    → { translated: { en: { nameEn: "...", descEn: "..." }, ja: {...}, ar: {...} } }
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth(["admin"]);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { text, texts, from, to, targets } = body;

    if (!from || typeof from !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'from' language" },
        { status: 400 },
      );
    }

    // Format 1: Single text
    if (typeof text === "string" && typeof to === "string") {
      const translated = await translateText(text, from, to);
      return NextResponse.json({ translated });
    }

    // Format 3: Bulk translate to multiple targets
    if (
      texts &&
      typeof texts === "object" &&
      Array.isArray(targets) &&
      targets.length > 0
    ) {
      const translated = await translateBulk(texts, from, targets);
      return NextResponse.json({ translated });
    }

    // Format 2: Batch translate to single target
    if (texts && typeof texts === "object" && typeof to === "string") {
      const translated = await translateBatch(texts, from, to);
      return NextResponse.json({ translated });
    }

    return NextResponse.json(
      {
        error:
          "Invalid request. Provide { text, from, to } or { texts, from, to } or { texts, from, targets }",
      },
      { status: 400 },
    );
  } catch (e) {
    console.error("[translate] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Translation failed" },
      { status: 500 },
    );
  }
}
