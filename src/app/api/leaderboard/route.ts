import { NextRequest, NextResponse } from "next/server";

const VALID_REGIONS = new Set(["na", "eu", "ap", "kr", "br", "latam"]);

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const region = searchParams.get("region")?.toLowerCase() || "na";
  const actId = searchParams.get("actId") || "";
  const size = searchParams.get("size") || "50";
  const startIndex = searchParams.get("startIndex") || "0";

  if (!VALID_REGIONS.has(region)) {
    return NextResponse.json({ error: "Invalid region." }, { status: 400 });
  }
  if (!actId) {
    return NextResponse.json({ error: "actId is required." }, { status: 400 });
  }

  const url = `https://${region}.api.riotgames.com/val/ranked/v1/leaderboards/by-act/${actId}?size=${size}&startIndex=${startIndex}`;

  try {
    const res = await fetch(url, {
      headers: { "X-Riot-Token": process.env.RIOT_API_KEY! },
      cache: "no-store",
    });
    const text = await res.text();
    if (!text) {
      return NextResponse.json({ error: "Empty response from Riot API." }, { status: 502 });
    }
    // Riot sometimes returns concatenated JSON objects — take only the first one
    let jsonStr = text;
    let depth = 0;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === "{") depth++;
      else if (text[i] === "}") depth--;
      if (depth === 0 && i > 0) {
        jsonStr = text.substring(0, i + 1);
        break;
      }
    }
    const data = JSON.parse(jsonStr);
    if (data.httpStatus && data.httpStatus >= 400) {
      return NextResponse.json({ error: data.message || "Leaderboard not found." }, { status: data.httpStatus });
    }
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to fetch leaderboard data." }, { status: 500 });
  }
}
