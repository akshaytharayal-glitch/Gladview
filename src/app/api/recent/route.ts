import { fetchRecent } from "@/lib/anilist";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Kept short so new episodes show up within a few minutes.
const RECENT_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=120, stale-while-revalidate=120",
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const page = Number(searchParams.get("page")) || 1;
    const perPage = Number(searchParams.get("per_page") || searchParams.get("perPage")) || 20;

    const data = await fetchRecent(page, perPage);
    return NextResponse.json(data, { headers: RECENT_CACHE_HEADERS });
  } catch (error: any) {
    return NextResponse.json(
      { page: 1, perPage: 20, total: 0, hasNextPage: false, results: [], error: error?.message },
      { status: 500 },
    );
  }
}
