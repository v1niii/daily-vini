import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const STRATS_FILE = path.join(process.cwd(), "data", "shared-strats.json");

function readStrats(): Record<string, unknown> {
  try { return JSON.parse(fs.readFileSync(STRATS_FILE, "utf-8")); }
  catch { return {}; }
}

function writeStrats(data: Record<string, unknown>) {
  const dir = path.dirname(STRATS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STRATS_FILE, JSON.stringify(data));
}

function genId(): string {
  return Math.random().toString(16).slice(2, 8).toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.steps || !body.map) return NextResponse.json({ error: "invalid strat" }, { status: 400 });
    const strats = readStrats();
    let id = genId();
    while (strats[id]) id = genId();
    strats[id] = { ...body, sharedAt: Date.now() };
    writeStrats(strats);
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: "failed to save" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const strats = readStrats();
  const strat = strats[id];
  if (!strat) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(strat);
}
