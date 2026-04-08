export interface MapData { id: string; name: string; img: string; }

export const MAPS: MapData[] = [
  { id: "abyss", name: "Abyss", img: "/maps/abyss.png" },
  { id: "ascent", name: "Ascent", img: "/maps/ascent.png" },
  { id: "bind", name: "Bind", img: "/maps/bind.png" },
  { id: "breeze", name: "Breeze", img: "/maps/breeze.png" },
  { id: "fracture", name: "Fracture", img: "/maps/fracture.png" },
  { id: "haven", name: "Haven", img: "/maps/haven.png" },
  { id: "icebox", name: "Icebox", img: "/maps/icebox.png" },
  { id: "lotus", name: "Lotus", img: "/maps/lotus.png" },
  { id: "pearl", name: "Pearl", img: "/maps/pearl.png" },
  { id: "split", name: "Split", img: "/maps/split.png" },
  { id: "sunset", name: "Sunset", img: "/maps/sunset.png" },
];

export const ROLE_ICONS: Record<string, string> = {
  Controller: "https://media.valorant-api.com/agents/roles/4ee40330-ecdd-4f2f-98a8-eb1243428373/displayicon.png",
  Duelist: "https://media.valorant-api.com/agents/roles/dbe8757e-9e92-4ed4-b39f-9dfc589691d4/displayicon.png",
  Initiator: "https://media.valorant-api.com/agents/roles/1b47567f-8f7b-444b-aae3-b0c634622d10/displayicon.png",
  Sentinel: "https://media.valorant-api.com/agents/roles/5fc02f99-4091-4486-a531-98459a3e95e9/displayicon.png",
};

export const COLORS = ["#ff4655", "#2dd4bf", "#fbbf24", "#60a5fa", "#ffffff", "#a855f7"];

export interface AgentAbility { name: string; slot: string; icon: string; }
export interface AgentData { uuid: string; name: string; icon: string; role: string; abilities: AgentAbility[]; }

export interface DrawPath {
  points: { x: number; y: number }[];
  color: string; size: number; tool: "pen" | "eraser";
}

export interface PlacedItem {
  id: string; x: number; y: number; rotation: number;
  imgUrl: string; label: string; size: number;
  team: "ally" | "enemy"; kind: "agent" | "ability" | "spike" | "image";
  aoe?: AoeShape; imgW?: number; imgH?: number;
}

export interface AoeShape {
  type: "circle" | "cone" | "line";
  radius: number; angle?: number; length?: number; color: string;
}

export interface TextItem {
  id: string; x: number; y: number; text: string;
  color: string; bold: boolean; fontSize: number;
}

export interface StratStep { paths: DrawPath[]; items: PlacedItem[]; texts: TextItem[]; }
export interface Strategy { id: string; name: string; map: string; side: "attack" | "defense"; steps: StratStep[]; createdAt: number; }

// Map ~120m across. 1m ≈ 0.0083.
// Only directional (cone/line) abilities get rotation handles.
export const ABILITY_AOE: Record<string, AoeShape> = {
  // ── Ult AOEs ──
  "Orbital Strike":  { type: "circle", radius: 0.075,  color: "rgba(255,120,50,0.25)" },
  "Lockdown":        { type: "circle", radius: 0.27,   color: "rgba(255,220,50,0.07)" },
  "NULL/cmd":        { type: "circle", radius: 0.12,   color: "rgba(100,180,255,0.12)" },
  "Viper's Pit":     { type: "circle", radius: 0.15,   color: "rgba(0,200,80,0.1)" },
  "Seekers":         { type: "circle", radius: 0.20,   color: "rgba(100,220,100,0.07)" },
  "Reckoning":       { type: "circle", radius: 0.085,  color: "rgba(50,180,220,0.12)" },
  "Steel Garden":    { type: "circle", radius: 0.07,   color: "rgba(160,160,200,0.15)" },
  "Armageddon":      { type: "circle", radius: 0.075,  color: "rgba(255,100,50,0.18)" },
  "Rolling Thunder": { type: "cone",   radius: 0.18,   angle: Math.PI / 2.5, color: "rgba(255,180,50,0.15)" },
  "Nightfall":       { type: "cone",   radius: 0.22,   angle: Math.PI / 3,   color: "rgba(80,50,150,0.15)" },
  "Showstopper":     { type: "cone",   radius: 0.12,   angle: Math.PI / 5,   color: "rgba(255,80,80,0.18)" },
  "Thrash":          { type: "cone",   radius: 0.10,   angle: Math.PI / 4,   color: "rgba(100,220,50,0.15)" },
  "Hunter's Fury":   { type: "line",   radius: 0.005,  length: 0.9, color: "rgba(50,150,255,0.25)" },
  "Cosmic Divide":   { type: "line",   radius: 0.003,  length: 0.8, color: "rgba(180,100,255,0.25)" },
  "Annihilation":    { type: "line",   radius: 0.008,  length: 0.25, color: "rgba(100,200,220,0.2)" },
  // ── Smokes ──
  "Sky Smoke":       { type: "circle", radius: 0.038,  color: "rgba(255,140,50,0.2)" },
  "Dark Cover":      { type: "circle", radius: 0.034,  color: "rgba(100,50,200,0.2)" },
  "Nebula":          { type: "circle", radius: 0.04,   color: "rgba(180,100,255,0.18)" },
  "Ruse":            { type: "circle", radius: 0.039,  color: "rgba(200,100,200,0.18)" },
  "Poison Cloud":    { type: "circle", radius: 0.038,  color: "rgba(0,200,80,0.2)" },
  "Cove":            { type: "circle", radius: 0.038,  color: "rgba(50,180,220,0.18)" },
  "Cloudburst":      { type: "circle", radius: 0.028,  color: "rgba(200,220,255,0.18)" },
  // ── Mollies ──
  "Incendiary":      { type: "circle", radius: 0.022,  color: "rgba(255,100,50,0.25)" },
  "Snake Bite":      { type: "circle", radius: 0.02,   color: "rgba(0,200,80,0.25)" },
  "Hot Hands":       { type: "circle", radius: 0.02,   color: "rgba(255,150,50,0.25)" },
  "FRAG/ment":       { type: "circle", radius: 0.025,  color: "rgba(100,180,255,0.2)" },
  "Mosh Pit":        { type: "circle", radius: 0.033,  color: "rgba(100,220,50,0.2)" },
  "Nanoswarm":       { type: "circle", radius: 0.02,   color: "rgba(255,220,50,0.2)" },
  // ── Utility ──
  "Regrowth":        { type: "circle", radius: 0.033,  color: "rgba(100,220,100,0.15)" },
  "Stim Beacon":     { type: "circle", radius: 0.03,   color: "rgba(255,140,50,0.12)" },
  "Nova Pulse":      { type: "circle", radius: 0.033,  color: "rgba(180,100,255,0.15)" },
  "Gravity Well":    { type: "circle", radius: 0.033,  color: "rgba(180,100,255,0.15)" },
  // ── Walls ──
  "Toxic Screen":    { type: "line",   radius: 0.003,  length: 0.35, color: "rgba(0,200,80,0.2)" },
  "Barrier Mesh":    { type: "line",   radius: 0.003,  length: 0.10, color: "rgba(100,200,220,0.2)" },
  "High Tide":       { type: "line",   radius: 0.004,  length: 0.30, color: "rgba(50,180,220,0.2)" },
  "Blaze":           { type: "line",   radius: 0.003,  length: 0.12, color: "rgba(255,150,50,0.2)" },
  "Contingency":     { type: "line",   radius: 0.003,  length: 0.10, color: "rgba(180,100,255,0.2)" },
  // ── Directional abilities ──
  "FLASH/drive":     { type: "cone",   radius: 0.05,   angle: Math.PI / 3, color: "rgba(100,180,255,0.1)" },
  "Flashpoint":      { type: "cone",   radius: 0.04,   angle: Math.PI / 2.5, color: "rgba(255,180,50,0.1)" },
};

export function hasDirectionalAoe(item: PlacedItem): boolean {
  return !!item.aoe && (item.aoe.type === "cone" || item.aoe.type === "line");
}

export function emptyStep(): StratStep { return { paths: [], items: [], texts: [] }; }
export function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
