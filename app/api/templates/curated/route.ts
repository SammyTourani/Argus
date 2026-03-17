import { CLONE_TEMPLATES } from "@/lib/clone-templates";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const browseStyle = searchParams.get("browseStyle");
  const search = searchParams.get("search")?.toLowerCase();
  const featured = searchParams.get("featured");
  const limit = Math.min(
    parseInt(searchParams.get("limit") || "50", 10),
    100
  );
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  let filtered = CLONE_TEMPLATES;

  if (category) {
    filtered = filtered.filter((t) => t.category === category);
  }
  if (browseStyle) {
    filtered = filtered.filter((t) => t.browseStyle === browseStyle);
  }
  if (featured === "true") {
    filtered = filtered.filter((t) => t.featured);
  }
  if (search) {
    filtered = filtered.filter(
      (t) =>
        t.name.toLowerCase().includes(search) ||
        t.desc.toLowerCase().includes(search) ||
        t.tags.some((tag) => tag.toLowerCase().includes(search))
    );
  }

  return NextResponse.json(
    {
      templates: filtered.slice(offset, offset + limit),
      total: filtered.length,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
