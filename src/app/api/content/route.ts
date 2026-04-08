import { NextRequest, NextResponse } from "next/server";

const VALID_REGIONS = new Set(["na", "eu", "ap", "kr", "br", "latam"]);

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const region = searchParams.get("region")?.toLowerCase() || "na";
  const locale = searchParams.get("locale") || "en-US";

  if (!VALID_REGIONS.has(region)) {
    return NextResponse.json({ error: "Invalid region." }, { status: 400 });
  }

  const url = `https://${region}.api.riotgames.com/val/content/v1/contents?locale=${locale}`;

  try {
    const res = await fetch(url, {
      headers: { "X-Riot-Token": process.env.RIOT_API_KEY! },
      cache: "no-store",
    });
    const text = await res.text();
    if (!text) {
      return NextResponse.json({ error: "Empty response from Riot API." }, { status: 502 });
    }
    const data = JSON.parse(text);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Failed to fetch content data." }, { status: 500 });
  }
}
